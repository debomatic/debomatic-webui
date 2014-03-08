
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
    socket.on('get-view', function(data) {
        socket.get('view', function(err, view) {
            if (!view || view != data) {
                socket.get('watchers', function(err, watchers) {
                    if (watchers) watchers.forEach(function(w){
                        w.close()
                    });
                    watchers = []
                    socket.set('view', data, function() {
                        packages_path = path.join(config.debomatic_path, data.distribution.name, 'pool')
                        // watch on incoming packages
                        try {
                            watchIncomingPackages = fs.watch(packages_path, { persistent: true}, function(event, fileName) {
                                if (event == 'rename')
                                    send.view(socket, data);
                            });
                            watchers.push(watchIncomingPackages);
                        } catch (err) {}
                        // if user is viewing a package, watch package dir
                        if (data.package && data.package.name && data.package.version) {
                            pack_path = path.join(packages_path, data.package.name + '_' + data.package.version);
                            try {
                                watchPackageFiles = fs.watch(pack_path, {persistent: true}, function (event, filename) {
                                    if (event == 'rename')
                                        send.view(socket, data);
                                });
                                watchers.push(watchPackageFiles)
                            } catch (err) {}
                        }
                        socket.set('watchers', watchers);
                    });
                });
                send.view(socket, data);
            };
        });
    });
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
