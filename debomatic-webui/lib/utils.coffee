path = require("path")
fs = require("fs")
config = require("./config")
Tail = require("./tail")

_check_no_backward = (backward_path) ->
    if typeof backward_path is 'string'
        return backward_path.indexOf("..") < 0
    return true

check_data_distribution = (data) ->
    _check_no_backward(data) and
    _check_no_backward(data.distribution) and
    _check_no_backward(data.distribution.name)


check_data_package = (data) ->
    check_data_distribution(data) and
    _check_no_backward(data.package) and
    _check_no_backward(data.package.name) and
    _check_no_backward(data.package.version)


check_data_file = (data) ->
    check_data_package(data) and
    _check_no_backward(data.file) and
    _check_no_backward(data.file.name)


get_distribution_pool_path = (data) ->
    path.join(config.debomatic.path, data.distribution.name, "pool")


get_package_path = (data) ->
    path.join(get_distribution_pool_path(data), data.package.orig_name)


get_file_path = (data) ->
    path.join(get_package_path(data),
              data.package.orig_name + "." + data.file.name)

get_files_list = (dir, onlyDirectories, callback) ->
    fs.readdir dir, (err, files) ->
        if err
            __errors_handler "__get_files_list", err
            return
        result = []
        for f in files
            try
                complete_path = path.join(dir, f)
                stat = fs.statSync(complete_path)
                if onlyDirectories
                    result.push(f) if stat.isDirectory()
                else
                    result.push(f) if stat.isFile()
            catch fs_error
                __errors_handler("__get_files_list:forEach", fs_error)
                continue
        callback(result)


watch_path_onsocket = (event_name, socket, data, watch_path, updater) ->
    socket_watchers = socket.watchers or {}
    try
        watcher = socket_watchers[event_name]
        watcher.close() if watcher
        fs.stat watch_path, (err, stats) ->
            if err
                __errors_handler("__watch_path_onsocket:fs.stat",
                                 err, socket)
                return

            if stats.isDirectory()
                watcher = fs.watch(watch_path,
                    persistent: true,
                    (event, fileName) ->
                        if event is "rename"
                            updater(event_name, socket, data))

            else if stats.isFile()
                watcher = new Tail(watch_path)
                watcher.on("line", (new_content, tailInfo) ->
                    data.file.new_content = new_content + "\n"
                    updater event_name, socket, data)

                watcher.on "error", (msg) ->
                    socket.emit config.events.error, msg

            socket_watchers[event_name] = watcher
            socket.watchers = socket_watchers

    catch err
        errors_handler("__watch_path_onsocket <- " +
                       arguments_.callee.caller.name,
                       err, socket)
        return


generic_handler_watcher = (event_name, socket, data, watch_path, callback) ->
    callback event_name, socket, data
    watch_path_onsocket event_name, socket, data, watch_path, callback


send_distributions = (socket) ->
    get_files_list config.debomatic.path, true, (directories) ->
        distributions = []
        for dir in directories
            data = {}
            data.distribution = {}
            data.distribution.name = dir
            pool_path = get_distribution_pool_path(data)
            distributions.push dir if fs.existsSync(pool_path)

        socket.emit config.events.broadcast.distributions, distributions

errors_handler = (from, error, socket) ->
    from = "NO SOCKET: " + from unless socket
    console.error from, err.message
    socket.emit config.events.error, err.message if socket
    return


module.exports.check_data_distribution = check_data_distribution
module.exports.check_data_package = check_data_package
module.exports.check_data_file = check_data_file
module.exports.get_distribution_pool_path = get_distribution_pool_path
module.exports.get_package_path = get_package_path
module.exports.get_file_path = get_file_path
module.exports.get_files_list = get_files_list
module.exports.watch_path_onsocket = watch_path_onsocket
module.exports.generic_handler_watcher = generic_handler_watcher
module.exports.send_distributions = send_distributions
module.exports.errors_handler = errors_handler
