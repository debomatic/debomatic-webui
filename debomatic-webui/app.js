
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , config = require('./config.js')
  , send = require('./send.js')()
  , fs = require('fs')

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
    send.distributions(io.sockets);
    socket.on('get-distribution', function(from, distro) {
        console.log(from + " " + distro)
        send.distribution(from, distro);
    });
});

fs.watch(config.debomatic_path, { persistent: true }, function (event, fileName) {
    send.distributions(io.sockets);
});

var server = app.listen(config.port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
