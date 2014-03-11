var config = require('./config.js')
  , fs = require('fs')
  , Tail = require('tail').Tail


// watcher on build_status
function __watch_build_status (socket, status) {

  status_watcher = new Tail(config.debomatic.jsonfile)

  status_watcher.on('line', function(new_content) {
    var data = null
    try {
      data = JSON.parse(new_content)
    } catch (error) { return }
    if (data.status == 'building') {
      status.packages.push(data)
    }
    else if (data.status == 'build-successed'
      || data.status == 'build-failed' )
    {
      for(i = 0; i < status.packages.length; i++)
      {
        p = status.packages[i]
        if ( p.package == data.package
          && p.distribution == data.distribution )
        {
          status.packages.splice(i, 1)
          break
        }
      }
    }
    socket.emit(config.events.broadcast.status_update, data)
  })
}

// watcher on new distributions
function __watch_distributions (socket) {
  fs.watch(config.debomatic.path, { persistent: true }, function (event, fileName) {
    utils.get_files_list(config.debomatic.path, true, function(distros) {
      socket.emit(config.events.broadcast.distributions, distros);
    })
  })
}

function Broadcaster (sockets, status) {

  var sockets = sockets

  __watch_build_status(sockets, status)

  __watch_distributions(sockets)

  return {

  }
}

module.exports = Broadcaster
