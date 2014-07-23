path = require('path')

class Parser
    constructor: ->
        @args = process.argv[2..]
        @name = process.argv[1].split("/").pop()
        if '-h' in @args
            @help()

    help: ->
        console.log """
                    Usage: %s [-c config]
                       -h print this help
                       -c set user configuration file
                    """, @name
        process.exit 1
        return

    getUserConfig: ->
        if '-c' in @args
            if @args.length < 2
                @help()
            user_config = @args[@args.indexOf('-c') + 1]
            if user_config[0] isnt '/'
                user_config = process.cwd() + "/" + user_config
            return path.normalize(user_config)
        return null

module.exports = Parser
