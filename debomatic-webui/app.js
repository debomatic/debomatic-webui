
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

io.sockets.on('connection', function(socket) {
    send.distributions(socket);
    
    // send distribution packages
    socket.on('get_distribution_packages', function (data) {
        if (!data)
            return
        socket.get("watcher-distribution-packages", function(err, watcher){
            if (watcher) 
                watcher.close()
            if (!data.distribution || !data.distribution.name)
                return
            packages_path = path.join(config.debomatic_path, data.distribution.name, 'pool')
            // watch for incoming packages
            try {
                watcher = fs.watch(packages_path, { persistent: true}, function(event, fileName) {
                    if (event == 'rename')
                        send.distribution_packages(socket, data);
                });
                socket.set('watcher-distribution-packages', watcher);
            } catch (err) {}
        })
        send.distribution_packages(socket, data);
    })
    
    socket.on('get_package_file_list', function(data) {
        if (!data)
            return
        socket.get('wather-package-files-list', function (err, watcher) {
            if (watcher)
                watcher.close()
            if (!data.distribution || !data.distribution.name ||
                ! data.package ||
                ! data.package.name || ! data.package.version)
                return
            package_path = path.join(config.debomatic_path, data.distribution.name, 'pool', data.package.name + "_" + data.package.version)
            try {
                watcher = fs.watch(package_path, { persistent: true}, function(event, fileName) {
                    if (event == 'rename')
                        send.package_file_list(socket, data);
                });
                socket.set('watcher-package-files-list', watcher);
            } catch (err) {}
        })
        send.package_file_list(socket, data);
    })
});


io.sockets.on('disconnect', function(socket){
    socket.get('watchers', function(err, watchers) {
        if (watchers) watchers.forEach(function(w){
            w.close()
        });
        socket.set('watchers', []);
    });
});

fs.watch(config.debomatic_path, { persistent: true }, function (event, fileName) {
    send.distributions(io.sockets);
});

var server = app.listen(config.port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
