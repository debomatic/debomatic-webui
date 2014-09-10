glob = require("glob")
config = require("../lib/config")
fs = require("fs")

exports.index = (req, res) ->
    res.render "index", config
    return

exports.distribution = (req, res) ->
    res.render "distribution", config
    return

exports.preferences = (req, res) ->
    res.render "preferences", config
    return

exports.commands = (req, res) ->
    res.render "commands", config
    return

exports.history = (req, res) ->
    glob "#{config.debomatic.path}/*/pool/*/*.json", {}, (err, files) ->
        get_info = (json_path) ->
            json = JSON.parse(fs.readFileSync(json_path, 'utf8'))
            delete json.files
            return json
        compare = (a,b) ->
            if a.start < b.start
                return -1
            if a.start > b.start
                return 1
            return 0

        config.history = (get_info(f) for f in files)
        config.history.sort(compare)
        res.render "history", config
