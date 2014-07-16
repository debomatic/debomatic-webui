__watch_status_check_same_obj = (obj1, obj2) ->
    if obj1.status is obj2.status
        if obj1.distribution is obj2.distribution
            if obj1.hasOwnProperty("package") and obj2.hasOwnProperty("package")
                return true if obj1.package is obj2.package
                return false
            return true
    false

# watcher on build_status
__watch_status = (socket, status) ->
    watcher = new Tail(config.debomatic.jsonfile)
    watcher.on "line", (new_content) ->
        data = null
        try
            data = JSON.parse(new_content)
        catch err
            utils.errors_handler "Broadcaster:" +
                                 "__watch_status:JSON.parse(new_content) - ",
                                 err, socket
            return

        # looking for same status already in statuses lists
        if data.hasOwnProperty("success")
            i = 0

            while i < status.length
                if __watch_status_check_same_obj(data, status[i])
                    status.splice i, 1
                    break
                else
                    continue
                i++
        else
            status.push data
        socket.emit config.events.broadcast.status_update, data
        return

    watcher.on "error", (msg) ->
        socket.emit config.events.error, msg
        return

    return

# watcher on new distributions
__watch_distributions = (socket) ->
    fs.watch config.debomatic.path,
        persistent: true
    , (event, fileName) ->

        # wait half a second to get pool subdir created
        setTimeout (->
            utils.send_distributions socket
            return
        ), 500
        return

    return
__watch_pidfile = (socket) ->
    fs.watchFile config.debomatic.pidfile, {
        persistent: false
        interval: 1007
    }
    , (curr, prev) ->
        # if === 0 means pidfile does not exists
        status_debomatic = running: curr.ino isnt 0
        try
            socket.emit socket.emit(
                config.events.broadcast.status_debomatic,
                status_debomatic)
        return

    return

Broadcaster = (sockets, status) ->
    __watch_status(sockets, status)
    __watch_distributions(sockets)
    __watch_pidfile(sockets)

"use strict"
config = require("./config")
fs = require("fs")
utils = require("./utils")
Tail = require("./tail")
module.exports = Broadcaster
