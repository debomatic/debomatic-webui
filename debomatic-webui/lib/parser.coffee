#jshint multistr: true 
Parser = ->
    args = process.argv.slice(2)
    help = ->
        console.log "Usage: %s [-c config]\n    -h        print this help \n    -c        set user configuration file", process.argv[1].split("/").pop()
        process.exit 0
        return

    @getUserConfig = ->
        configFile = null
        args.forEach (val, index) ->
            if val is "-c"
                configFile = args[index + 1]
                return

        if configFile
            process.cwd() + "/" + configFile
        else
            null

    args.forEach (val, index) ->
        help() if val is "-h"
        return

    return
"use strict"
module.exports = Parser
