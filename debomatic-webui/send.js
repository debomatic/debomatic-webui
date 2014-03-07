var fs = require('fs')
  , path = require('path')
  , config = require('./config.js')

var BASE_DIR = config.debomatic_path;

function get_files_list(dir, onlyDirectories, callback) {
    fs.readdir(dir, function(err, files){
        result = [];
        if (err) { 
            console.log.error(err); 
            return; 
        }
        files.forEach( function(f) {
            complete_path = path.join(dir, f);
            if (onlyDirectories) {
                if (fs.statSync(complete_path).isDirectory()) {
                    result.push(f);
                }
            }
            else {
                if (fs.statSync(complete_path).isFile()) {
                    result.push(f);
                }
            }
        });
        callback(result);
    });
}

function get_distributions(socket) {
}

function get_packages_list(socket, distro) {
    var pool = path.join(BASE_DIR, distro, 'pool');
    
    return pool;
}

debomatic_sender = {
    distributions: function(socket) {
        get_files_list(BASE_DIR, true, function(distros){
            socket.emit('distributions', distros);
        });
    },

    packages_list: function(socket, distro) {
        socket.emit('packages', get_packages_list(socket, distro));
    },
}

module.exports = debomatic_sender
