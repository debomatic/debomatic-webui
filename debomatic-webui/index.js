
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

// no log
//var io = require('socket.io').listen(app, { log: false });
var io = require('socket.io').listen(app);

// statuses
var status = {}
status.packages = []

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

var broadcast = new Broadcaster(io.sockets, status)

io.sockets.on('connection', function(socket) {
  client = new Client(socket)
  client.start()
  if (status.packages.length > 0)
    client.send_status(status)
});

io.sockets.on('disconnect', function(socket){

});

var server = app.listen(config.port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
