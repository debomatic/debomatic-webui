var fs = require('fs')
  , path = require('path')
  , config = require('./config.js')

var BASE_DIR = config.debomatic_path;

function get_files_list(dir, onlyDirectories, callback) {
    fs.readdir(dir, function(err, files){
        result = [];
        if (err) { 
            console.error(err); 
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

debomatic_sender = {

    distributions: function(socket) {
        get_files_list(BASE_DIR, true, function(distros){
            socket.emit('distributions', distros);
        });
    },

    packages_list: function(socket, distro) {
        distro_path = path.join(BASE_DIR, distro, 'pool');
        get_files_list(distro_path, true, function (packages) {
            result = {}
            result.distribution = distro;
            result.packages = []
            packages.forEach( function (p) {
                pack = {}
                info = p.split('_')
                pack.name = info[0]
                pack.version = info[1]
                result.packages.push(pack)
            });
            socket.emit('packages', result);
        });
    },
    
    package: function (socket, package_info) {
        package_path = path.join(BASE_DIR, package_info.distribution, 'pool', package_info.package + "_" + package_info.version);
        get_files_list(package_path, false, function(files) {
            package_info.files = []
            package_info.debs = []
            package_info.archives = []
            files.forEach(function (f) {
                extension = f.split('.').pop();
                if (extension == "deb" || extension == "ddeb")
                    package_info.debs.push(f);
                else if (f.indexOf('.tar') >= 0) {
                    archive = {}
                    archive.name = f
                    archive.path = path.join(package_path, f)
                    package_info.archives.push(archive)
                }
                else {
                    file = {}
                    file.name = f
                    file.path = path.join(package_path, f)
                    file.label = extension
                    package_info.files.push(file)
                }
            });
            socket.emit('package-files', package_info);
        });
    }
}

module.exports = debomatic_sender
