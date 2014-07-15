"use strict"
fs = require("fs")
Tail = require("tail").Tail
Tail::watchEvent = (e) ->
  _this = this
  if e is "change"
    fs.stat @filename, (err, stats) ->
      if err
        _this.emit "error", err
        return
      _this.pos = stats.size  if stats.size < _this.pos
      if stats.size > _this.pos
        _this.queue.push
          start: _this.pos
          end: stats.size

        _this.pos = stats.size
        _this.internalDispatcher.emit "next"  if _this.queue.length is 1

  else if e is "rename"
    @unwatch()
    _this.emit "error", "File " + @filename + " deleted."
  return

Tail::close = ->
  @unwatch()
  return

module.exports = Tail
