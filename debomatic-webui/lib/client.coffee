fs = require("fs")
path = require("path")
config = require("./config")
utils = require("./utils")
e = config.events.client

get_files_list_from_package = (data, callback) ->
    package_path = utils.get_package_path(data)
    utils.get_files_list package_path, false, (files) ->
        data.package.files = []
        data.package.debs = []
        data.package.sources = []
        for f in files
            file = {}
            file.extension = f.split(".").pop()
            continue if file.extension in config.debomatic.excluded_files
            file.path = path.join(package_path, f)
                            .replace(config.debomatic.path,
                                     config.routes.debomatic)
            file.orig_name = f
            file.name = f.split("_")[0]
            if file.extension in ["deb", "ddeb", "udeb"]
                data.package.debs.push(file)
            else if file.extension in ["changes", "dsc"] or f.indexOf('.tar.') > 0 or f.indexOf('.diff.') > 0
                file.name = f.replace(data.package.orig_name + ".", "")
                if file.extension is "changes"
                    file.name = f.split('_').pop()
                else if f.indexOf('.orig.tar') > 0
                    file.name = "orig." + f.split(".orig.").pop()
                else if f.indexOf('.diff.') > 0
                    file.name = "diff." + f.split(".diff.").pop()
                data.package.sources.push(file)
            else
                file.name = file.extension
                data.package.files.push(file)
        callback(data)


read_package_status = (data, cb) ->
    package_path = utils.get_package_path(data)
    package_json = path.join(package_path, data.package.orig_name + ".json")
    fs.readFile package_json, {encoding: "utf8"}, (err, content) ->
        if err
            utils.errors_handler "Client:read_package_status:", err
            return
        try
            content = JSON.parse(content)
        catch parseerr
            utils.errors_handler("Client:" +
                                 "read_package_status:parseerr:",
                                 parseerr)
            return
        cb content

class Client

    constructor: (@socket) ->

    send_package_files_list: (data) ->
        get_files_list_from_package data, (new_data) =>
            @socket.emit e.package_files_list, new_data

    send_distribution_packages: (data) ->
        distro_path = utils.get_distribution_pool_path(data)
        utils.get_files_list distro_path, true, (packages) =>
            data.distribution.packages = []
            for p in packages
                pack = {}
                info = p.split("_")
                pack.name = info[0]
                pack.version = info[1]
                pack.orig_name = p
                read_package_status {distribution: data.distribution, package: pack}, (content) =>
                    @socket.emit e.distribution_packages_status, content
                data.distribution.packages.push pack
            @socket.emit e.distribution_packages, data

    send_file: (data) ->
        file_path = utils.get_file_path(data)
        get_preview = data.file.name in config.web.file.preview and not data.file.force
        fs.readFile file_path, "utf8", (err, content) =>
            if err
                utils.errors_handler("client:send_file", err, @socket)
                return
            data.file.orig_name = file_path.split("/").pop()
            if get_preview and config.web.file.num_lines > 0
                last_lines = config.web.file.num_lines
                data.file.content = content.split("\n")[-last_lines..].join("\n")
            else
                data.file.content = content
            data.file.path = file_path.replace(config.debomatic.path,
                                               config.routes.debomatic)
            @socket.emit e.file, data

    send_status: (status) ->
        data = status
        if status instanceof Array == false
            data = []
            data.push v for k, v of status
        @socket.emit e.status, data

    send_status_debomatic: (running) ->
        @socket.emit config.events.broadcast.status_debomatic, running: running

    send_distributions: (distributions) ->
        @socket.emit config.events.broadcast.distributions, distributions

    start: ->

        # init events
        @socket.on e.distribution_packages, (data) =>
            return unless utils.check_data_distribution(data)
            distribution_path = utils.get_distribution_pool_path(data)
            @send_distribution_packages(data)
            utils.watch_path_onsocket e.distribution_packages, @socket, data, distribution_path, (new_data) =>
                @send_distribution_packages(new_data)

        @socket.on e.package_files_list, (data) =>
            return unless utils.check_data_package(data)
            package_path = utils.get_package_path(data)
            @send_package_files_list(data)
            utils.watch_path_onsocket e.package_files_list, @socket, data, package_path, (new_data) =>
                @send_package_files_list(new_data)

        @socket.on e.file, (data) =>
            return unless utils.check_data_file(data)
            file_path = utils.get_file_path(data)
            data.file.content = null
            @send_file(data)
            utils.watch_path_onsocket e.file_newcontent, @socket, data, file_path, (new_data) =>
                @socket.emit(e.file_newcontent, new_data)

        @socket.on e.package_info, (data) =>
            return unless utils.check_data_package(data)
            read_package_status data, (content) =>
                @socket.emit e.package_info, content

        # on client disconnection close all watchers
        @socket.on "disconnect", =>
            socket_watchers = @socket.watchers
            return unless socket_watchers
            for key of socket_watchers
                try
                    socket_watchers[key].close()
                catch error_watch
                    utils.errors_handler "client:disconnect", error_watch

module.exports = Client
