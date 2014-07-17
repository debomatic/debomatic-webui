fs = require("fs")
Tail = require("tail").Tail

class MyTail extends Tail

    watchEvent: (e) ->
        if e is 'change'
            stats = fs.statSync(@filename)
            @pos = stats.size if stats.size < @pos #scenario where texts is not appended but it's actually a w+
            if stats.size > @pos
                @queue.push({start: @pos, end: stats.size})
                @pos = stats.size
                @internalDispatcher.emit("next") if @queue.length is 1
        else if e is 'rename'
            @unwatch()
            @emit "error", "File " + @filename + " deleted."

    close: () ->
        @unwatch()
        return

module.exports = MyTail
