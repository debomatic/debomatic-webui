var fs = require('fs')
  , path = require('path')
  , Tail = require('tail').Tail
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
      try {
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
      } catch (fs_error) {}
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
      file.path = path.join(package_path, f).replace(config.debomatic.path, config.routes.debomatic)
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

function __send_package_files_list (event_name, socket, data) {
  __get_files_list_from_package(data, function(new_data){
    socket.emit(event_name, new_data)
  });
}

function __send_distribution_packages (event_name, socket, data) {
  distro_path = utils.get_distribution_pool_path(data)
  __get_files_list(distro_path, true, function (packages) {
    data.distribution.packages = []
    packages.forEach( function (p) {
      pack = {}
      info = p.split('_')
      pack.name = info[0]
      pack.version = info[1]
      pack.orig_name = p
      if( data.package &&
        pack.name == data.package.name &&
        pack.version == data.package.version ) {
          pack.selected = true;
      }
      data.distribution.packages.push(pack)
    });
    socket.emit(event_name, data)
  });
}

function __send_file (event_name, socket, data) {
  file_path = utils.get_file_path(data)
  fs.readFile(file_path, 'utf8', function (err, content) {
    if (err) return;
    data.file.orig_name = file_path.split('/').pop()
    data.file.content = content
    data.file.path = file_path.replace(config.debomatic.path, config.routes.debomatic)
    socket.emit(event_name, data)
  });
}

function __send_distributions(event_name, socket, data) {
  __get_files_list(config.debomatic.path, true, function(distros){
    socket.emit(event_name, distros);
  });
}

function __watch_path_onsocket(event_name, socket, data, watch_path, updater) {
  name = "watcher-" + event_name
  socket.get(name, function (err, watcher) {
    if (watcher) {
      try {
        watcher.unwatch()
      } catch (errorWatchingDirectory) {
        watcher.close()
      }
    }
    try {
      fs.stat(watch_path, function(err, stats) {
        if (err)
          return
        if (stats.isDirectory()) {
          watcher = fs.watch(watch_path, {persistent: true}, function (event, fileName) {
          if(event == 'rename')
            updater(event_name, socket, data)
          })
        }
        else {
          watcher = new Tail(watch_path)
          watcher.on('line', function(new_content) {
            data.file.new_content = new_content + '\n'
            updater(event_name, socket, data)
          })
        }
        socket.set(name, watcher)
      })
    } catch (err_watch) {}
  })
}

function __file_newcontent(event_name, socket, data) {
  if(! utils.check_data_file(data))
    return
  data.file.content = null
  socket.emit(event_name, data)
}

function __handler_get_distributions (socket, data) {
  event_name = 'distributions'
  __watch_path_onsocket(event_name,socket, data, config.debomatic.path, __send_distributions)
  __send_distributions(event_name, socket, data)
}

function __handler_get_package_files_list (socket, data) {
  event_name = 'package_files_list'
  package_path = utils.get_package_path(data)
  __watch_path_onsocket(event_name, socket, data, package_path, __send_package_files_list)
  __send_package_files_list(event_name, socket, data)
}

function __handler_get_distribution_packages (socket, data) {
  event_name = 'distribution_packages'
  distribution_path = path.join(config.debomatic.path, data.distribution.name, 'pool')
  __watch_path_onsocket(event_name, socket, data, distribution_path, __send_distribution_packages)
  __send_distribution_packages(event_name, socket, data)
}

function __handler_get_file (socket, data) {
  file_path = utils.get_file_path(data)
  __watch_path_onsocket('file_newcontent', socket, data, file_path, __file_newcontent)
  __send_file('file', socket, data)
}

Client = function (socket) {

  __handler_get_distributions(socket);
  
  // send distribution packages
  socket.on('get_distribution_packages', function (data) {
    if (! utils.check_data_distribution(data))
      return
    __handler_get_distribution_packages(socket, data);
  })
  
  socket.on('get_package_files_list', function(data) {
    if (! utils.check_data_package(data))
      return
    __handler_get_package_files_list(socket, data)
  })
  
  socket.on('get_file', function (data){
    if (! utils.check_data_file(data))
      return
    __handler_get_file(socket, data)
  })

  return {
  }
}

module.exports = Client
