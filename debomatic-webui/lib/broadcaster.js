var config = require('./config.js')
  , fs = require('fs')
  , Tail = require('./tail.js')

function __watch_status_check_same_obj (obj1, obj2) {
  if (obj1.status == obj2.status) {
    if (obj1.distribution == obj2.distribution) {
      if (obj1.hasOwnProperty('package') && 
          obj2.hasOwnProperty('package')) 
      {
        if (obj1.package == obj2.package)
          return true;
        return false
      }
      return true
    }
  }
  return false
}

// watcher on build_status
function __watch_status (socket, status) {

  var watcher = new Tail(config.debomatic.jsonfile)
  watcher.on('line', function(new_content) {
    var data = null
    try {
      data = JSON.parse(new_content)
    } catch (err) {
      utils.errors_handler('Broadcaster:__watch_status:JSON.parse(new_content) - ', err, socket)
      return
    }
    // looking for same status already in statuses lists
    if (data.hasOwnProperty('success')) {
      for(i = 0; i < status.length; i++) {
        if (__watch_status_check_same_obj(data, status[i])) {
          status.splice(i, 1)
          break;
        }
        else
          continue;
      }
    }
    else {
      status.push(data)
    }
    socket.emit(config.events.broadcast.status_update, data)
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

  __watch_status(sockets, status)

  __watch_distributions(sockets)

  return {

  }
}

module.exports = Broadcaster
