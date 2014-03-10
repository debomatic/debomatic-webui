
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , path = require('path')
  , Tail = require('tail').Tail
  , config = require('./lib/config.js')
  , client = require('./lib/client.js')
  , utils = require('./lib/utils.js')

var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);

// status
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

io.sockets.on('connection', function(socket) {
  utils.send_distributions(socket)
  socket.emit('status', status)
  client(socket)
});

io.sockets.on('disconnect', function(socket){

});

// watcher on new distributions
fs.watch(config.debomatic.path, { persistent: true }, function (event, fileName) {
  utils.send_distributions(io.sockets);
});

// watcher on build_status
status_watcher = new Tail(config.debomatic.jsonfile)

status_watcher.on('line', function(new_content) {
  data = null
  try {
    data = JSON.parse(new_content)
  } catch (error) { return }
  if (data.status == 'building') {
    status.packages.push(data)
  }
  else if (data.status == 'build-successed'
    || data.status == 'build-failed' )
  {
    for(i = 0; i < status.packages.length; i++)
    {
      p = status.packages[i]
      if ( p.package == data.package
        && p.distribution == data.distribution )
      {
        status.packages.splice(i, 1)
        break
      }
    }
  }
  io.sockets.emit(config.events.broadcast.status_update, data)
})

var server = app.listen(config.port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
