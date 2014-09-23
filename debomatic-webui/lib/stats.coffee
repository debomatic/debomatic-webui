fs = require('fs')
glob = require('glob')
exec = require('child_process').exec
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
            utils.errors_handler "stats:get_all_packages", err
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


get_disk_usage = (cb) ->
    exec "du -BM -d 2 #{config.debomatic.path}", (error, stdout, stderr) ->
        if error?
            if stderr?
                error = '\n\t' + stderr.replace(/\n/g, '\n\t')
            utils.errors_handler "disk usage error:", error
            return
        result = {}
        others = 0
        for line in stdout.split('\n')
            continue if line == ''
            info = line.split(/\t+/g)
            size = parseInt(info[0])
            dirs = info[1].replace("#{config.debomatic.path}", '').split('/')

            # case total size for debomatic incoming
            if dirs.length <= 1
                result['size'] = size
                continue
            distribution = dirs[1]

            if not result[distribution]?
                result[distribution] = {}

            # case total size for distribution
            if dirs.length == 2
                result[distribution]['size'] = size
                result[distribution]['others'] = others
                others = 0
                continue

            # case size for distribution/subdir
            subdir = dirs[2]
            subdir = "chroot" if distribution == subdir
            if subdir in config.debomatic.disk_usage_subdirs
                result[distribution][subdir] = size
            else
                others += size

        cb(result)

module.exports.get_all_packages = get_all_packages
module.exports.get_disk_usage = get_disk_usage
