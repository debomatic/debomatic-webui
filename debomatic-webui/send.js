var fs = require('fs')
  , path = require('path')
  , config = require('./config.js')

var BASE_DIR = config.debomatic_path;

function __get_files_list(dir, onlyDirectories, callback) {
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

function __get_files_list_from_pacakge(package_path, callback) {
    package_info = {}
    __get_files_list(package_path, false, function(files) {
        package_info.files = []
        package_info.debs = []
        package_info.archives = []
        files.forEach(function (f) {
            file = {}
            file.path = path.join(package_path, f).replace(config.debomatic_path, config.debomatic_webpath)
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

function __send_package_files_list (socket, data) {
    if (!data.package || ! data.distribution)
        return
    distro_path = path.join(BASE_DIR, data.distribution.name, 'pool');
    p = data.package.name + "_" + data.package.version
    package_path = path.join(distro_path, p)
    __get_files_list_from_pacakge(package_path, function(package_files){
        data.package.files = package_files.files
        data.package.debs = package_files.debs
        data.package.archives = package_files.archives
        socket.emit('package_file_list', data)
    });
}

function __send_distribution_packages (socket, data) {
    if (!data.distribution || ! data.distribution.name)
        return;
    distro_path = path.join(BASE_DIR, data.distribution.name, 'pool');
    __get_files_list(distro_path, true, function (packages) {
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
        socket.emit("distribution_packages", data)
    });
}

debomatic_sender = {

    distributions: function(socket) {
        __get_files_list(BASE_DIR, true, function(distros){
            socket.emit('distributions', distros);
        });
    },

    package_file_list: function(socket, data) {
        __send_package_files_list(socket, data)
    },

    distribution_packages: function(socket, data) {
        __send_distribution_packages(socket, data)
    }
}

module.exports = debomatic_sender
