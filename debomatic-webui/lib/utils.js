var path = require('path')
  , fs = require('fs')
  , Tail = require('tail').Tail
  , config = require('./config.js')

function __check_data_distribution(data) {
  return data && data.distribution && data.distribution.name
}

function __check_data_package(data) {
  return __check_data_distribution(data) && data.package && data.package.name && data.package.version
}

function __check_data_file(data) {
  return __check_data_package(data) && data.file && data.file.name
}

function __get_distribution_pool_path(data) {
  return path.join(config.debomatic.path, data.distribution.name, 'pool')
}

function __get_package_path(data) {
  return path.join(__get_distribution_pool_path(data), data.package.name + '_' + data.package.version)
}

function __get_file_path(data) {
  return path.join(__get_package_path(data), data.package.name + '_' + data.package.version + '.' + data.file.name)
}

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
        stat = fs.statSync(complete_path)
        if (onlyDirectories) {
          if (stat.isDirectory()) {
            result.push(f);
          }
        }
        else {
          if (stat.isFile()) {
            result.push(f);
          }
        }
      } catch (fs_error) {}
    });
    callback(result);
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

function __generic_handler_watcher(event_name, socket, data, watch_path, callback) {
  __watch_path_onsocket(event_name, socket, data, config.debomatic.path, callback)
  callback(event_name, socket, data)
}

function __send_distributions(event_name, socket) {
  __get_files_list(config.debomatic.path, true, function(distros){
    socket.emit(event_name, distros);
  });
}

utils = {
  check_data_distribution: function(data) {
    return __check_data_distribution(data)
  },
  check_data_package: function(data) {
    return __check_data_package(data)
  },
  check_data_file: function(data) {
    return __check_data_file(data)
  },
  get_distribution_pool_path: function(data) {
    return __get_distribution_pool_path(data)
  },
  get_package_path: function(data) {
    return __get_package_path(data)
  },
  get_file_path: function(data) {
    return __get_file_path(data)
  },
  get_files_list: function(dir, onlyDirectories, callback) {
    return __get_files_list(dir, onlyDirectories, callback)
  },
  watch_path_onsocket: function(event_name, socket, data, watch_path, updater) {
    return __watch_path_onsocket(event_name, socket, data, watch_path, updater)
  },
  generic_handler_watcher: function(event_name, socket, data, watch_path, callback) {
    return __generic_handler_watcher(event_name, socket, data, watch_path, callback);
  },
  send_distributions: function (socket, event_name) {
    if (! event_name)
      event_name = 'distributions'
    return __send_distributions(event_name, socket);
  },
}

module.exports = utils
