
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , path = require('path')
  , config = require('./lib/config.js')
  , client = require('./lib/client.js')
  , utils = require('./lib/utils.js')

var app = module.exports = express.createServer();

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

var io = require('socket.io').listen(app);

// Routes
app.get('/', routes.index);
app.get(config.routes.distribution, routes.distribution)

io.sockets.on('connection', function(socket) {
  client(socket)
});

io.sockets.on('disconnect', function(socket){

});

// watch for new distributions
fs.watch(config.debomatic.path, { persistent: true }, function (event, fileName) {
  utils.send_distributions(io.sockets);
});

var server = app.listen(config.port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
