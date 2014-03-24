var config = require('./config.js')
  , fs = require('fs')
  , Tail = require('./tail.js')


// watcher on build_status
function __watch_build_status (socket, status) {

  var watcher = new Tail(config.debomatic.jsonfile)
  watcher.on('line', function(new_content) {
    var data = null
    try {
      data = JSON.parse(new_content)
    } catch (err) {
      utils.errors_handler('Broadcaster:__watch_build_status:JSON.parse(new_content) - ', err, socket)
      return
    }

    // looking for same package already in status.packages
    var index = -1
    for(i = 0; i < status.packages.length; i++)
    {
      p = status.packages[i]
      if ( p.package == data.package
        && p.distribution == data.distribution )
      {
        index = i
        break
      }
    }

    if (data.status == config.status.package.building) {
      if (index == -1) { // not found in status.packages
        status.packages.push(data)
        socket.emit(config.events.broadcast.status_update, data)
        return
      }
    }

    if (data.status == config.status.package.successed
      || data.status == config.status.package.failed ) 
    {
      if (index >= 0) { // found in status.packages - remove
        status.packages.splice(index, 1)
      }
      socket.emit(config.events.broadcast.status_update, data)
    }
  })
  watcher.on('error', function(msg) {
    socket.emit(config.events.error, msg)
  })
}

// watcher on new distributions
function __watch_distributions (socket) {
  fs.watch(config.debomatic.path, { persistent: true }, function (event, fileName) {
    // wait half a second to get pool subdir created
    setTimeout(function() {
      utils.send_distributions(socket)
    }, 500)
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
