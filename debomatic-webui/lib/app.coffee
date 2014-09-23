###
Module dependencies.
###
app = module.exports = require("express")()
server = require("http").createServer(app)
io = require("socket.io")(server)

serve_static = require("serve-static")
serve_index = require("serve-index")
errorhandler = require("errorhandler")

routes = require("../routes")
config = require("./config")
utils = require("./utils")

Client = require("./client")
Debomatic = require("./debomatic")


# error handler setup
env = process.env.NODE_ENV or "development"
if env is "development"
    app.use(errorhandler({dumpExceptions: true, showStack: true}))
else
    app.use(errorhandler())

# the views
app.set("views", __dirname + "/../views")
app.set("view engine", "ejs")

# index page
app.get("/", routes.index)

# distribution page
app.get(config.routes.distribution, routes.distribution)

# preferences page
if config.routes.preferences
    app.get(config.routes.preferences, routes.preferences)

# commands page
if config.routes.commands
    app.get(config.routes.commands, routes.commands)

# history page
if config.routes.history
    app.get(config.routes.history, routes.history)

# debomatic static page
if config.routes.debomatic
    chroot_forbidden = (res) ->
        res.status(403).send """<h1>403 Forbidden</h1>
                                 <h2>You cannot see the chroot internals</h2>"""

    app.all config.routes.debomatic + '/:distribution/:subdir/*', (req, res, next) ->
        if req.params.distribution == req.params.subdir
            chroot_forbidden(res)
        else
            next()

    app.all config.routes.debomatic + '/:distribution/build/*/*', (req, res) ->
        chroot_forbidden(res)

    # set the right content-type for log files
    app.get config.routes.debomatic + '/:distribution/logs/:file', (req, res, next) ->
        res.set('Content-Type', 'text/plain')
        next()

    app.use(config.routes.debomatic, serve_static(config.debomatic.path))
    app.use(config.routes.debomatic, serve_index(config.debomatic.path,
                                                 {view: "details", icons: true}))

# serve stylesheet-javascript
app.use(serve_static(__dirname + "/../public"))

# serve dsc files as octet-stream
serve_static.mime.define("application/octet-stream": ["dsc"])

# Listening
server.listen config.port, config.host, null, (err) ->

    debomatic = new Debomatic(io.sockets)
    debomatic.start()

    io.sockets.on "connection", (socket) ->
        client = new Client(socket)
        client.start()
        client.send_status(debomatic.status)
        client.send_status_debomatic(debomatic.running)
        client.send_distributions(debomatic.distributions)

    console.log "Debomatic-webui listening on %s:%d in %s mode",
                server.address().address,
                server.address().port,
                app.settings.env

server.on "error", (e) ->
    if e.code is "EADDRINUSE"
        console.log "Address in use %s:%d. Exit.", config.host, config.port
        process.exit 3
    else
        console.error e
    return
