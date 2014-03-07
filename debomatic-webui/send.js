var fs = require('fs')
  , path = require('path')
  , config = require('./config.js')

module.exports = function () {
    return {
        distributions: function(callback) {
            var callback = callback;
            fs.readdir(config.debomatic_path, function(err, files){
                if (err) {
                    throw err;
                }
                distros = []
                files.forEach( function(f) {
                    complete_path = path.join(config.debomatic_path, f);
                    if (fs.statSync(complete_path).isDirectory()) distros.push(f);
                });
                callback.emit('distributions', distros);
            });
        },
        distribution: function(socket, distro) {
            console.log(distro);
            socket.emit('distribution', {bla: 'blabla'});
        }
    }
}
