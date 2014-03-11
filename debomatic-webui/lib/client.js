var fs = require('fs')
  , path = require('path')
  , config = require('./config.js')
  , utils = require('./utils.js')

function __get_files_list_from_package(data, callback) {
  package_path = utils.get_package_path(data)
  utils.get_files_list(package_path, false, function(files) {
    data.package.files = []
    data.package.debs = []
    data.package.sources = []
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
        file.name = f.replace(data.package.name + '_' + data.package.version + '.', '')
        if (file.extension == 'changes')
          file.name = file.extension
        else if (f.indexOf('.tar') >= 0 && f.indexOf('.orig.') > 0)
          file.name = 'orig.' + f.split('.orig.').pop()
        data.package.sources.push(file)
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
  utils.get_files_list(distro_path, true, function (packages) {
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

function __handler_get_file (socket, data) {
  file_path = utils.get_file_path(data)
  utils.watch_path_onsocket(events.file_newcontent, socket, data, file_path, function(event_name, socket, data) {
    data.file.content = null
    socket.emit(event_name, data)
  })
  __send_file(events.file.set, socket, data)
}

function Client (socket) {

  events = config.events.client

  socket.on(events.distribution_packages.get, function (data) {
    if (! utils.check_data_distribution(data))
      return
    distribution_path = path.join(config.debomatic.path, data.distribution.name, 'pool')
    utils.generic_handler_watcher(events.distribution_packages.set, socket, data, distribution_path, __send_distribution_packages)
  })
  
  socket.on(events.package_files_list.get, function(data) {
    if (! utils.check_data_package(data))
      return
    package_path = utils.get_package_path(data)
    utils.generic_handler_watcher(events.package_files_list.set, socket, data, package_path, __send_package_files_list)
  })
  
  socket.on(events.file.get, function (data){
    if (! utils.check_data_file(data))
      return
    __handler_get_file(socket, data)
  })

  return {
  }
}

module.exports = Client
