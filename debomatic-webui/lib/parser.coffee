path = require('path')

Parser = ->
    args = process.argv[2..]

    help = ->
        console.log """
                    Usage: %s [-c config]
                       -h print this help
                       -c set user configuration file
                    """, process.argv[1].split("/").pop()
        process.exit 0
        return

    @getUserConfig = ->
        if '-c' in args
            if args.length < 2
                help()
            return args[args.indexOf('-c') + 1]
        return null

    if '-h' in args
        help()

module.exports = Parser
