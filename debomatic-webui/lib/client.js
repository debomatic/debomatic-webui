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
            if (config.debomatic.excluded_files.indexOf(file.extension) >= 0)
                return;
            if (file.extension == 'deb' || file.extension == 'ddeb' || file.extension == 'udeb') {
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

function __read_package_status(data, cb) {
    var package_path = utils.get_package_path(data);
    var package_json = path.join(package_path, data.package.orig_name + '.json');
    fs.readFile(package_json, {
        encoding: 'utf8'
    }, function (err, content) {
        if (err) {
            utils.errors_handler('Client:__read_package_status:', err);
            return;
        }
        try {
            content = JSON.parse(content);
        } catch (parse_err) {
            utils.errors_handler('Client:__read_package_status:parse_err:', parse_err);
            return;
        }
        cb(content);
    });
}

function __send_package_info(socket, data) {
    __read_package_status(data, function (content) {
        socket.emit(_e.package_info, content);
    });
}

function __send_package_status(socket, data) {
    __read_package_status(data, function (content) {
        socket.emit(_e.distribution_packages_status, content);
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
            __send_package_status(socket, {
                distribution: data.distribution,
                package: pack
            });
            data.distribution.packages.push(pack);
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
            data = null;
        });

        socket.on(_e.package_files_list, function (data) {
            if (!utils.check_data_package(data))
                return;
            var package_path = utils.get_package_path(data);
            utils.generic_handler_watcher(_e.package_files_list, socket, data, package_path, __send_package_files_list);
            data = null;
        });

        socket.on(_e.file, function (data) {
            if (!utils.check_data_file(data))
                return;
            __handler_get_file(socket, data);
            data = null;
        });

        socket.on(_e.package_info, function (data) {
            if (!utils.check_data_package(data))
                return;
            __send_package_info(socket, data);
            data = null;
        });


        // on client disconnection close all watchers
        socket.on('disconnect', function () {
            var socket_watchers = socket.watchers;
            if (!socket_watchers)
                return;
            for (var key in socket_watchers) {
                try {
                    socket_watchers[key].close();
                } catch (error_watch) {
                    utils.errors_handler('client:disconnect', error_watch);
                }
            }
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
