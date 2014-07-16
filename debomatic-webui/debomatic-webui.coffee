"use strict"

###
Module dependencies.
###
http = require("http")
express = require("express")
serve_static = require("serve-static")
serve_index = require("serve-index")
errorhandler = require("errorhandler")
routes = require("./routes")
config = require("./lib/config")
utils = require("./lib/utils")
Client = require("./lib/client")
Broadcaster = require("./lib/broadcaster")
app = module.exports = express()
server = http.createServer(app)
io = require("socket.io")(server)
env = process.env.NODE_ENV or "development"
if "development" is env
    app.use errorhandler(
        dumpExceptions: true
        showStack: true
    )
else app.use errorhandler() if "production" is env
app.set "views", __dirname + "/views"
app.set "view engine", "ejs"

# index page
app.get "/", routes.index

# distibution page
app.get config.routes.distribution, routes.distribution

# parefernces page
if config.routes.preferences
    app.get config.routes.preferences, routes.preferences

# commands page
app.get config.routes.commands, routes.commands if config.routes.commands

# debomatic static page
if config.routes.debomatic
    app.all config.routes.debomatic + "*", (req, res, next) ->

        # send 403 status when users want to browse the chroots:
        # - unstable/unstable
        # - unstable/build/*
        # this prevents system crashes
        base = config.routes.debomatic
        base += (if base[base.length - 1] isnt "/" then "/" else "") # append /
        match = req.url.replace(base, "").split("/")
        match.pop() if match[match.length - 1] is ""

        if match.length >= 2 and
        ((match[0] is match[1]) or # case unstable/unstable
        (match[1] is "build" and match.length > 2)) # case unstable/build/*
            res.status(403).send "<h1>403 Forbidden</h1>"
        else # call next() here to move on to next middleware/router
            next()
        return

    app.use config.routes.debomatic, serve_static(config.debomatic.path)
    app.use config.routes.debomatic, serve_index(config.debomatic.path,
        view: "details"
        icons: true
    )

# serve stylesheet-javascript
app.use serve_static(__dirname + "/public")

# serve dsc files as octet-stream
serve_static.mime.define "application/octet-stream": ["dsc"]

# Listening
server.listen config.port, config.host, null, (err) ->

    # Checking nodejs with sudo:
    # Find out which user used sudo through the environment variable
    # and set his user id
    uid = parseInt(process.env.SUDO_UID)
    if uid
        console.log "Please do not run nodejs with sudo. " +
                    "Changing user to %d", uid
        process.setgid uid
        process.setuid uid

    # statuses
    status = []
    broadcast = new Broadcaster(io.sockets, status)
    io.sockets.on "connection", (socket) ->
        client = new Client(socket)
        client.start()
        client.send_status status if status.length > 0
        client.send_status_debomatic()
        return

    console.log "Debomatic-webui listening on %s:%d in %s mode",
                server.address().address,
                server.address().port,
                app.settings.env
    return

server.on "error", (e) ->
    if e.code is "EADDRINUSE"
        console.log "Address in use %s:%d. Exit.", config.host, config.port
        process.exit 1
    else
        console.error e
    return
