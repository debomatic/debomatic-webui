__errors_handler = (from, err, socket) ->
  from = "NO SOCKET: " + from  unless socket
  console.error from, err.message
  socket.emit config.events.error, err.message  if socket
  return
__check_no_backward = (backward_path) ->
  try
    return backward_path.indexOf("..") < 0
  catch err
    return true
  return
__check_data_distribution = (data) ->
  __check_no_backward(data) and __check_no_backward(data.distribution) and __check_no_backward(data.distribution.name)
__check_data_package = (data) ->
  __check_data_distribution(data) and __check_no_backward(data.package) and __check_no_backward(data.package.name) and __check_no_backward(data.package.version)
__check_data_file = (data) ->
  __check_data_package(data) and __check_no_backward(data.file) and __check_no_backward(data.file.name)
__get_distribution_pool_path = (data) ->
  path.join config.debomatic.path, data.distribution.name, "pool"
__get_package_path = (data) ->
  path.join __get_distribution_pool_path(data), data.package.name + "_" + data.package.version
__get_file_path = (data) ->
  path.join __get_package_path(data), data.package.name + "_" + data.package.version + "." + data.file.name
__get_files_list = (dir, onlyDirectories, callback) ->
  fs.readdir dir, (err, files) ->
    result = []
    if err
      __errors_handler "__get_files_list", err
      return
    files.forEach (f) ->
      try
        complete_path = path.join(dir, f)
        stat = fs.statSync(complete_path)
        if onlyDirectories
          result.push f  if stat.isDirectory()
        else
          result.push f  if stat.isFile()
      catch fs_error
        __errors_handler "__get_files_list:forEach", fs_error
        return
      return

    callback result
    return

  return
__watch_path_onsocket = (event_name, socket, data, watch_path, updater) ->
  socket_watchers = socket.watchers or {}
  try
    watcher = socket_watchers[event_name]
    watcher.close()  if watcher
    fs.stat watch_path, (err, stats) ->
      if err
        __errors_handler "__watch_path_onsocket:fs.stat", err, socket
        return
      if stats.isDirectory()
        watcher = fs.watch(watch_path,
          persistent: true
        , (event, fileName) ->
          updater event_name, socket, data  if event is "rename"
          return
        )
      else if stats.isFile()
        watcher = new Tail(watch_path)
        watcher.on "line", (new_content, tailInfo) ->
          data.file.new_content = new_content + "\n"
          updater event_name, socket, data
          return

        watcher.on "error", (msg) ->
          socket.emit config.events.error, msg
          return

      socket_watchers[event_name] = watcher
      socket.watchers = socket_watchers
      return

  catch err
    __errors_handler "__watch_path_onsocket <- " + arguments_.callee.caller.name, err, socket
    return
  return
__generic_handler_watcher = (event_name, socket, data, watch_path, callback) ->
  callback event_name, socket, data
  __watch_path_onsocket event_name, socket, data, watch_path, callback
  return
__send_distributions = (socket) ->
  __get_files_list config.debomatic.path, true, (directories) ->
    distributions = []
    directories.forEach (dir) ->
      data = {}
      data.distribution = {}
      data.distribution.name = dir
      pool_path = __get_distribution_pool_path(data)
      distributions.push dir  if fs.existsSync(pool_path)
      return

    socket.emit config.events.broadcast.distributions, distributions
    return

  return
"use strict"
path = require("path")
fs = require("fs")
config = require("./config")
Tail = require("./tail")
utils =
  check_data_distribution: (data) ->
    __check_data_distribution data

  check_data_package: (data) ->
    __check_data_package data

  check_data_file: (data) ->
    __check_data_file data

  get_distribution_pool_path: (data) ->
    __get_distribution_pool_path data

  get_package_path: (data) ->
    __get_package_path data

  get_file_path: (data) ->
    __get_file_path data

  get_files_list: (dir, onlyDirectories, callback) ->
    __get_files_list dir, onlyDirectories, callback

  watch_path_onsocket: (event_name, socket, data, watch_path, updater) ->
    __watch_path_onsocket event_name, socket, data, watch_path, updater

  generic_handler_watcher: (event_name, socket, data, watch_path, callback) ->
    __generic_handler_watcher event_name, socket, data, watch_path, callback

  send_distributions: (socket) ->
    __send_distributions socket

  errors_handler: (from, error, socket) ->
    __errors_handler from, error, socket

module.exports = utils
