fs = require("fs")
glob = require("glob")
config = require("./config")
utils = require("./utils")
Tail = utils.Tail
e = config.events.broadcast

_get_distributions = (callback) ->
    glob "#{config.debomatic.path}/*/pool", {}, (err, directories) ->
        distributions = []
        for dir in directories
            name = dir.split('/')[-2..][0]
            distributions.push name
        callback(distributions)


class Debomatic

    constructor: (@sockets) ->
        @status = {}
        @distributions = []
        @running = fs.existsSync (config.debomatic.pidfile)
        _get_distributions (distributions) => @distributions = distributions

    # watcher on new distributions
    watch_distributions: ->
        fs.watch config.debomatic.path, (event, fileName) =>
            check = =>
                _get_distributions (new_distributions) =>
                    if not utils.arrayEqual(@distributions, new_distributions)
                        @distributions = new_distributions
                        @sockets.emit(e.distributions, @distributions)
            # wait half a second to get pool subdir created
            setTimeout(check, 500)

    watch_pidfile: ->
        fs.watchFile config.debomatic.pidfile, (curr, prev) =>
            # if === 0 means pidfile does not exists
            @running = curr.ino isnt 0
            @sockets.emit e.status_debomatic, running: @running

    # watcher on build_status
    watch_status: ->
        watcher = new Tail(config.debomatic.jsonfile)
        watcher.on "line", (new_content) =>
            data = null
            try
                data = JSON.parse(new_content)
            catch err
                utils.errors_handler "Debomatoci:" +
                                     "watch_status:JSON.parse(new_content) - ",
                                     err, @sockets
                return
            # get a id rapresentation of status
            get_key = (status) ->
                key = status.distribution
                key += "/#{status.package}" if status.package?
                key += "/#{status.status}" if status.status?
                return key
            key = get_key(data)
            if @status[key]? and data["success"]?
                delete @status[key]
            else if not @status[key]? and not data["success"]?
                @status[key] = data
            @sockets.emit e.status_update, data

        watcher.on "error", (msg) =>
            @sockets.emit config.events.error, msg

    start: ->
        # if json file does not still exist wait for its creation
        if not fs.existsSync(config.debomatic.jsonfile)
            fs.watchFile config.debomatic.jsonfile, (curr, prev) =>
                if curr.ino isnt 0
                    fs.unwatchFile(config.debomatic.jsonfile)
                    @watch_status()
        else
            @watch_status()

        @watch_pidfile()
        @watch_distributions()

module.exports = Debomatic
