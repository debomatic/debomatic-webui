
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , fs = require('fs')
  , path = require('path')
  , config = require('./lib/config.js')
  , send = require('./lib/send.js')
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
  app.use(config.debomatic.webpath, express.directory(config.debomatic.path));
  app.use(config.debomatic.webpath, express.static(config.debomatic.path));
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
app.get('/distribution', routes.distribution)

io.sockets.on('connection', function(socket) {
  send.distributions(socket);
  
  // send distribution packages
  socket.on('get_distribution_packages', function (data) {
    if (! utils.check_data_distribution(data))
      return
    send.distribution_packages(socket, data);
  })
  
  socket.on('get_package_files_list', function(data) {
    if (! utils.check_data_package(data))
      return
    send.package_files_list(socket, data)
    
  })
  
  socket.on('get_file', function (data){
    if (! utils.check_data_file(data))
      return
    send.file(socket, data)
  })
});

io.sockets.on('disconnect', function(socket){

});

fs.watch(config.debomatic.path, { persistent: true }, function (event, fileName) {
  send.distributions(io.sockets);
});

var server = app.listen(config.port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
