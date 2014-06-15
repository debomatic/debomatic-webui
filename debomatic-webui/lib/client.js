'use strict';
var fs = require('fs'),
    path = require('path'),
    config = require('./config.js'),
    utils = require('./utils.js');

var _e = config.events.client;

function __get_files_list_from_package(data, callback) {
    var package_path = utils.get_package_path(data);
    utils.get_files_list(package_path, false, function (files) {
        data.package.files = [];
        data.package.debs = [];
        data.package.sources = [];
        files.forEach(function (f) {
            var file = {};
            file.path = path.join(package_path, f).replace(config.debomatic.path, config.routes.debomatic);
            file.orig_name = f;
            file.name = f.split('_')[0];
            file.extension = f.split('.').pop();
            if (file.extension == 'deb' || file.extension == 'ddeb') {
                data.package.debs.push(file);
            } else if (f.indexOf('.tar') >= 0 || file.extension == 'changes' || file.extension == 'dsc') {
                file.name = f.replace(data.package.name + '_' + data.package.version + '.', '');
                if (file.extension == 'changes')
                    file.name = file.extension;
                else if (f.indexOf('.tar') >= 0 && f.indexOf('.orig.') > 0)
                    file.name = 'orig.' + f.split('.orig.').pop();
                data.package.sources.push(file);
            } else {
                file.name = file.extension;
                data.package.files.push(file);
            }
        });
        callback(data);
    });
}

function __send_package_files_list(event_name, socket, data) {
    __get_files_list_from_package(data, function (new_data) {
        socket.emit(event_name, new_data);
    });
}

function __send_package_status(socket, data, package_data) {

    var event_name = config.events.client.distribution_packages_status;

    var new_data = {};
    new_data.distribution = data.distribution;
    new_data.package = package_data;

    var status_data = {};
    status_data.status = config.status.build;
    status_data.distribution = data.distribution.name;
    status_data.package = package_data.orig_name;

    var package_path = utils.get_package_path(new_data);

    //  status policy:
    //  + successed: exists .dsc
    //  + building: wc -l .datestamp == 1 (FIX_ME)
    //  + failed: else
    var base_path = path.join(package_path, package_data.orig_name);
    fs.exists(base_path + '.dsc', function (dsc_exists) {
        if (dsc_exists) {
            status_data.success = config.status.success;
            socket.emit(event_name, status_data);
        } else {
            // emulate wc -l .datestamp in nodejs
            var count = 0;
            var datestamp = base_path + '.datestamp';
            fs.exists(datestamp, function (datestamp_exists) {
                if (datestamp_exists) {
                    // count lines
                    fs.createReadStream(datestamp)
                        .on('data', function (chunk) {
                            for (var i = 0; i < chunk.length; ++i)
                                if (chunk[i] == 10) count++;
                        })
                        .on('end', function () {
                            if (count > 1)
                                status_data.success = config.status.fail;
                            socket.emit(event_name, status_data);
                        });
                }
            });
        }
    });
}

function __send_distribution_packages(event_name, socket, data) {
    var distro_path = utils.get_distribution_pool_path(data);
    utils.get_files_list(distro_path, true, function (packages) {
        data.distribution.packages = [];
        packages.forEach(function (p) {
            var pack = {};
            var info = p.split('_');
            pack.name = info[0];
            pack.version = info[1];
            pack.orig_name = p;
            data.distribution.packages.push(pack);
            __send_package_status(socket, data, pack);
        });
        socket.emit(event_name, data);
    });
}

function __send_file(event_name, socket, data, last_lines) {
    var file_path = utils.get_file_path(data);
    fs.readFile(file_path, 'utf8', function (err, content) {
        if (err) {
            utils.errors_handler('client:__send_file', err, socket);
            return;
        }
        data.file.orig_name = file_path.split('/').pop();
        if (last_lines > 0)
            data.file.content = content.split('\n').slice(-last_lines).join('\n');
        else
            data.file.content = content;
        data.file.path = file_path.replace(config.debomatic.path, config.routes.debomatic);
        socket.emit(event_name, data);
    });
}

function __handler_get_file(socket, data) {
    var file_path = utils.get_file_path(data);
    utils.watch_path_onsocket(_e.file_newcontent, socket, data, file_path, function (event_name, socket, data) {
        data.file.content = null;
        socket.emit(event_name, data);
    });
    if (config.web.file.preview.indexOf(data.file.name) >= 0 && !data.file.force)
        __send_file(_e.file, socket, data, config.web.file.num_lines);
    else
        __send_file(_e.file, socket, data);
}

function Client(socket) {

    this.start = function () {
        // init send distributions
        utils.send_distributions(socket);

        // init events
        socket.on(_e.distribution_packages, function (data) {
            if (!utils.check_data_distribution(data))
                return;
            var distribution_path = path.join(config.debomatic.path, data.distribution.name, 'pool');
            utils.generic_handler_watcher(_e.distribution_packages, socket, data, distribution_path, __send_distribution_packages);
        });

        socket.on(_e.package_files_list, function (data) {
            if (!utils.check_data_package(data))
                return;
            var package_path = utils.get_package_path(data);
            utils.generic_handler_watcher(_e.package_files_list, socket, data, package_path, __send_package_files_list);
        });

        socket.on(_e.file, function (data) {
            if (!utils.check_data_file(data))
                return;
            __handler_get_file(socket, data);
        });


        // on client disconnection close all watchers
        socket.on('disconnect', function () {
            socket.get('watchers', function (err, socket_watchers) {
                if (!socket_watchers)
                    return;
                for (var key in socket_watchers) {
                    try {
                        socket_watchers[key].close();
                    } catch (error_watch) {}
                }
            });
        });

    };

    this.send_status = function (status) {
        socket.emit(_e.status, status);
    };

    this.send_status_debomatic = function () {
        fs.exists(config.debomatic.pidfile, function (exists) {
            socket.emit(config.events.broadcast.status_debomatic, {
                'running': exists
            });
        });
    };
}

module.exports = Client;
