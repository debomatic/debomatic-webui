
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , config = require('./config.js')
  , send = require('./send.js')
  , fs = require('fs')
  , path = require('path')

var app = module.exports = express.createServer();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(config.debomatic_webpath, express.directory(config.debomatic_path));
  app.use(config.debomatic_webpath, express.static(config.debomatic_path));
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

function watcher_on_socket(event_name, socket, data, watch_path, updater) {
    name = "watcher-" + event_name
    socket.get(name, function (err, watcher) {
        if (watcher)
            watcher.close()
        try {
            watcher = fs.watch(watch_path, {persistent: true}, function (event, fileName) {
                if(event == 'rename')
                    updater(socket, data)
            })
            socket.set(name, watcher)
        } catch (err_watch) {}
    })
}

function check_data_distribution(data) {
    return data && data.distribution && data.distribution.name
}

function check_data_package(data) {
    return check_data_distribution(data) && data.package && data.package.name && data.package.version
}

io.sockets.on('connection', function(socket) {
    send.distributions(socket);
    
    // send distribution packages
    socket.on('get_distribution_packages', function (data) {
        if (! check_data_distribution(data))
            return
        distribution_path = path.join(config.debomatic_path, data.distribution.name, 'pool')
        watcher_on_socket('get_distribution_packages', socket, data, distribution_path, send.distribution_packages)
        send.distribution_packages(socket, data);
    })
    
    socket.on('get_package_file_list', function(data) {
        if (! check_data_package(data))
            return
        package_path = path.join(config.debomatic_path, data.distribution.name, 'pool', data.package.name + "_" + data.package.version)
        watcher_on_socket('get_package_file_list', socket, data, package_path, send.package_file_list)
        send.package_file_list(socket, data)
        
    })
});


io.sockets.on('disconnect', function(socket){

});

fs.watch(config.debomatic_path, { persistent: true }, function (event, fileName) {
    send.distributions(io.sockets);
});

var server = app.listen(config.port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
