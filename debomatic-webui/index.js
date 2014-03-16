
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , config = require('./lib/config.js')
  , utils = require('./lib/utils.js')
  , Client = require('./lib/client.js')
  , Broadcaster = require('./lib/broadcaster.js')

var app = module.exports = express.createServer();

var io = require('socket.io').listen(app, config.socket);

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(config.routes.debomatic, express.directory(config.debomatic.path));
  app.use(config.routes.debomatic, express.static(config.debomatic.path));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', routes.index);
app.get(config.routes.distribution, routes.distribution)
if (config.routes.preferences)
  app.get(config.routes.preferences, routes.preferences)

// Listening
var server = app.listen(config.port, config.host, null, function(err){

  if (err) {
    console.log(err)
    return
  }

  // Checking nodejs with sudo:
  // Find out which user used sudo through the environment variable
  // and set his user id
  var uid = parseInt(process.env.SUDO_UID);
  if (uid) {
    console.log("Please do not run nodejs with sudo. Changing user to %d", uid)
    process.setgid(uid);
    process.setuid(uid);
  }

  // statuses
  var status = {}
  status.packages = []

  var broadcast = new Broadcaster(io.sockets, status)

  io.sockets.on('connection', function(socket) {
    var client = new Client(socket)
    client.start()
    if (status.packages.length > 0)
      client.send_status(status)
  });

  console.log("Debomatic-webui listening on %s:%d in %s mode", app.address().address, app.address().port, app.settings.env);
});
