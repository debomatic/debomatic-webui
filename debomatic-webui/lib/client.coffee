__get_files_list_from_package = (data, callback) ->
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
            else if file.extension in ["changes", "dsc"] or f.indexOf('.tar') > 0
                file.name = f.replace(data.package.orig_name + ".", "")
                if file.extension is "changes"
                    file.name = file.extension
                else if f.indexOf('.orig.tar') > 0
                    file.name = "orig." + f.split(".orig.").pop()
                data.package.sources.push(file)
            else
                file.name = file.extension
                data.package.files.push(file)
        callback(data)


__send_package_files_list = (event_name, socket, data) ->
    __get_files_list_from_package data, (new_data) ->
        socket.emit event_name, new_data
        return

    return
__read_package_status = (data, cb) ->
    package_path = utils.get_package_path(data)
    package_json = path.join(package_path, data.package.orig_name + ".json")
    fs.readFile package_json, {encoding: "utf8"}, (err, content) ->
        if err
            utils.errors_handler "Client:__read_package_status:", err
            return
        try
            content = JSON.parse(content)
        catch parse_err
            utils.errors_handler("Client:" +
                                 "__read_package_status:parse_err:",
                                 parse_err)
            return
        cb content
        return

    return
__send_package_info = (socket, data) ->
    __read_package_status data, (content) ->
        socket.emit _e.package_info, content
        return

    return
__send_package_status = (socket, data) ->
    __read_package_status data, (content) ->
        socket.emit _e.distribution_packages_status, content
        return

    return
__send_distribution_packages = (event_name, socket, data) ->
    distro_path = utils.get_distribution_pool_path(data)
    utils.get_files_list distro_path, true, (packages) ->
        data.distribution.packages = []
        packages.forEach (p) ->
            pack = {}
            info = p.split("_")
            pack.name = info[0]
            pack.version = info[1]
            pack.orig_name = p
            __send_package_status socket,
                distribution: data.distribution
                package: pack

            data.distribution.packages.push pack
            return

        socket.emit event_name, data
        return

    return
__send_file = (event_name, socket, data, last_lines) ->
    file_path = utils.get_file_path(data)
    fs.readFile file_path, "utf8", (err, content) ->
        if err
            utils.errors_handler "client:__send_file", err, socket
            return
        data.file.orig_name = file_path.split("/").pop()
        if last_lines > 0
            data.file.content = content.split("\n")[-last_lines..].join("\n")
        else
            data.file.content = content
        data.file.path = file_path.replace(config.debomatic.path,
                                           config.routes.debomatic)
        socket.emit event_name, data
        return

    return
__handler_get_file = (socket, data) ->
    file_path = utils.get_file_path(data)
    send = (event_name, socket, data) ->
        data.file.content = null
        socket.emit event_name, data
    utils.watch_path_onsocket(_e.file_newcontent, socket, data, file_path, send)

    if data.file.name in config.web.file.preview and not data.file.force
        __send_file(_e.file, socket, data, config.web.file.num_lines)
    else
        __send_file(_e.file, socket, data)
    return


Client = (socket) ->
    @start = ->

        # init send distributions
        utils.send_distributions socket

        # init events
        socket.on _e.distribution_packages, (data) ->
            return unless utils.check_data_distribution(data)
            distribution_path = utils.get_distribution_pool_path(data)
            utils.generic_handler_watcher(_e.distribution_packages,
                                          socket,
                                          data,
                                          distribution_path,
                                          __send_distribution_packages)
            data = null
            return

        socket.on _e.package_files_list, (data) ->
            return unless utils.check_data_package(data)
            package_path = utils.get_package_path(data)
            utils.generic_handler_watcher(_e.package_files_list,
                                          socket,
                                          data,
                                          package_path,
                                          __send_package_files_list)
            data = null
            return

        socket.on _e.file, (data) ->
            return unless utils.check_data_file(data)
            __handler_get_file socket, data
            data = null
            return

        socket.on _e.package_info, (data) ->
            return unless utils.check_data_package(data)
            __send_package_info socket, data
            data = null
            return


        # on client disconnection close all watchers
        socket.on "disconnect", ->
            socket_watchers = socket.watchers
            return unless socket_watchers
            for key of socket_watchers
                try
                    socket_watchers[key].close()
                catch error_watch
                    utils.errors_handler "client:disconnect", error_watch
            return

        return

    @send_status = (status) ->
        socket.emit _e.status, status
        return

    @send_status_debomatic = ->
        fs.exists config.debomatic.pidfile, (exists) ->
            socket.emit config.events.broadcast.status_debomatic,
                running: exists
            return
        return
    return

"use strict"
fs = require("fs")
path = require("path")
config = require("./config")
utils = require("./utils")
_e = config.events.client
module.exports = Client
