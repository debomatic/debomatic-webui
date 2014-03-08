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

function get_files_list_from_pacakge(package_path, callback) {
    package_info = {}
    get_files_list(package_path, false, function(files) {
        package_info.files = []
        package_info.debs = []
        package_info.archives = []
        files.forEach(function (f) {
            file = {}
            file.path = path.join(pack_path, f).replace(config.debomatic_path, config.debomatic_webpath)
            file.orig_name = f
            file.name = f.split('_')[0]
            file.label = f.replace(file.name + '_', '')
            file.extension = f.split('.').pop();
            if (file.extension == "deb" || file.extension == "ddeb")
                package_info.debs.push(file);
            else if (f.indexOf('.tar') >= 0 || file.extension == "changes" || file.extension == "dsc") {
                package_info.archives.push(file)
            }
            else {
                file.name = file.extension
                package_info.files.push(file)
            }
        });
        callback(package_info);
    });
}

debomatic_sender = {

    distributions: function(socket) {
        get_files_list(BASE_DIR, true, function(distros){
            socket.emit('distributions', distros);
        });
    },

    view: function (socket, data) {
        distro_path = path.join(BASE_DIR, data.distribution.name, 'pool');
        get_files_list(distro_path, true, function (packages) {
            data.distribution.packages = []
            packages.forEach( function (p) {
                pack = {}
                info = p.split('_')
                pack.name = info[0]
                pack.version = info[1]
                if(data.package &&
                    pack.name == data.package.name &&
                    pack.version == data.package.version ) {
                        pack.selected = true;
                }
                data.distribution.packages.push(pack)
            });
            if (data.package) {
                p = data.package.name + "_" + data.package.version
                    package_path = path.join(distro_path, p)
                    get_files_list_from_pacakge(package_path, function(package_files){
                        data.package.files = package_files.files
                        data.package.debs = package_files.debs
                        data.package.archives = package_files.archives
                        socket.emit('view', data)
                    });
            }
            else {
                socket.emit('view', data)
            }
        });
    }
}

module.exports = debomatic_sender
