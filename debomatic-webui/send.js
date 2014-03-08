var fs = require('fs')
  , path = require('path')
  , config = require('./config.js')
  , utils = require('./utils.js')

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

function __get_files_list_from_package(data, callback) {
  package_path = utils.get_package_path(data)
  __get_files_list(package_path, false, function(files) {
    data.package.files = []
    data.package.debs = []
    data.package.archives = []
    files.forEach(function (f) {
      file = {}
      file.path = path.join(package_path, f).replace(config.debomatic.path, config.debomatic.webpath)
      file.orig_name = f
      file.name = f.split('_')[0]
      file.label = f.replace(file.name + '_', '')
      file.extension = f.split('.').pop();
      if (file.extension == "deb" || file.extension == "ddeb") {
        file.label = file.extension
        data.package.debs.push(file);
      }
      else if (f.indexOf('.tar') >= 0 || file.extension == "changes" || file.extension == "dsc") {
        file.name = f.replace(data.package.name + '_' + data.package.version, '')
        data.package.archives.push(file)
      }
      else {
        file.name = file.extension
        data.package.files.push(file)
      }
    });
    callback(data);
  });
}

function __send_package_files_list (socket, data) {
  __get_files_list_from_package(data, function(new_data){
    socket.emit('package_file_list', new_data)
  });
}

function __send_distribution_packages (socket, data) {
  distro_path = utils.get_distribution_pool_path(data)
  __get_files_list(distro_path, true, function (packages) {
    data.distribution.packages = []
    packages.forEach( function (p) {
      pack = {}
      info = p.split('_')
      pack.name = info[0]
      pack.version = info[1]
      if( data.package &&
        pack.name == data.package.name &&
        pack.version == data.package.version ) {
          pack.selected = true;
      }
      data.distribution.packages.push(pack)
    });
    socket.emit("distribution_packages", data)
  });
}

function __send_file (socket, data) {
  file_path = utils.get_file_path(data)
  fs.readFile(file_path, 'utf8', function (err, content) {
    if (err) return;
    data.file.orig_name = file_path.split('/').pop()
    data.file.content = content
    socket.emit('file', data)
  });
}

sender = {

  distributions: function(socket) {
    __get_files_list(config.debomatic.path, true, function(distros){
      socket.emit('distributions', distros);
    });
  },

  package_file_list: function(socket, data) {
    __send_package_files_list(socket, data)
  },

  distribution_packages: function(socket, data) {
    __send_distribution_packages(socket, data)
  },
  
  file: function(socket, data) {
    __send_file(socket, data)
  },
  
  file_newcontent: function(socket, data) {
    socket.emit('file_newcontent', data);
  }
}

module.exports = sender
