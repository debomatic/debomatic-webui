
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , config = require('./config.js')
  , send = require('./send.js')
  , fs = require('fs')
  , path = require('path')
  , utils = require('./utils.js')
  , Tail = require('tail').Tail

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

function watch_path_onsocket(event_name, socket, data, watch_path, updater) {
  name = "watcher-" + event_name
  socket.get(name, function (err, watcher) {
    if (watcher) {
      try {
        watcher.unwatch()
      } catch (errorWatchingDirectory) {
        watcher.close()
      }
    }
    try {
      fs.stat(watch_path, function(err, stats) {
        if (err)
          return
        if (stats.isDirectory()) {
          watcher = fs.watch(watch_path, {persistent: true}, function (event, fileName) {
          if(event == 'rename')
            updater(socket, data)
          })
        }
        else {
          watcher = new Tail(watch_path)
          watcher.on('line', function(new_content) {
            data.file.new_content = new_content + '\n'
            updater(socket, data)
          })
        }
        socket.set(name, watcher)
      })
    } catch (err_watch) {}
  })
}

io.sockets.on('connection', function(socket) {
  send.distributions(socket);
  
  // send distribution packages
  socket.on('get_distribution_packages', function (data) {
    if (! utils.check_data_distribution(data))
      return
    distribution_path = path.join(config.debomatic.path, data.distribution.name, 'pool')
    watch_path_onsocket('get_distribution_packages', socket, data, distribution_path, send.distribution_packages)
    send.distribution_packages(socket, data);
  })
  
  socket.on('get_package_file_list', function(data) {
    if (! utils.check_data_package(data))
      return
    package_path = utils.get_package_path(data)
    watch_path_onsocket('get_package_file_list', socket, data, package_path, send.package_file_list)
    send.package_file_list(socket, data)
    
  })
  
  socket.on('get_file', function (data){
    if (! utils.check_data_file(data))
      return
    file_path = utils.get_file_path(data)
    watch_path_onsocket('get_file', socket, data, file_path, send.file_newcontent)
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
