fs = require('fs')
glob = require('glob')
config = require('./config')
utils = require('./utils')

get_all_packages = (cb) ->
    compare = (a,b) ->
        if a.start < b.start
            return -1
        if a.start > b.start
            return 1
        return 0

    glob "#{config.debomatic.path}/*/pool/*/*.json", {}, (err, files) ->
        if err?
            utils.errors_handler "history:get_all_packages", err
            return
        packages = []
        for f in files
            fs.readFile f, (readerr, data) ->
                if readerr?
                    utils.errors_handler "history:get_all_packages:readFile", readerr
                    json = ''
                else
                    json = JSON.parse(data)
                    delete json.files
                packages.push(json)
                if packages.length == files.length
                    packages.sort(compare)
                    cb(packages)


module.exports.get_all_packages = get_all_packages
