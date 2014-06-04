'use strict';

var path = require('path'),
    fs = require('fs'),
    config = require('./config.js'),
    Tail = require('./tail.js');

function __errors_handler(from, err, socket) {
    if (!socket)
        from = 'NO SOCKET: ' + from;
    console.error(from, err);
    if (socket)
        socket.emit(config.events.error, err.message);
}

function __check_no_backward(backward_path) {
    try {
        return backward_path.indexOf('..') < 0;
    } catch (err) {
        return true;
    }
}

function __check_data_distribution(data) {
    return __check_no_backward(data) && __check_no_backward(data.distribution) && __check_no_backward(data.distribution.name);
}

function __check_data_package(data) {
    return __check_data_distribution(data) && __check_no_backward(data.package) && __check_no_backward(data.package.name) && __check_no_backward(data.package.version);
}

function __check_data_file(data) {
    return __check_data_package(data) && __check_no_backward(data.file) && __check_no_backward(data.file.name);
}

function __get_distribution_pool_path(data) {
    return path.join(config.debomatic.path, data.distribution.name, 'pool');
}

function __get_package_path(data) {
    return path.join(__get_distribution_pool_path(data), data.package.name + '_' + data.package.version);
}

function __get_file_path(data) {
    return path.join(__get_package_path(data), data.package.name + '_' + data.package.version + '.' + data.file.name);
}

function __get_files_list(dir, onlyDirectories, callback) {
    fs.readdir(dir, function (err, files) {
        var result = [];
        if (err) {
            __errors_handler('__get_files_list', err);
            return;
        }
        files.forEach(function (f) {
            try {
                var complete_path = path.join(dir, f);
                var stat = fs.statSync(complete_path);
                if (onlyDirectories) {
                    if (stat.isDirectory()) {
                        result.push(f);
                    }
                } else {
                    if (stat.isFile()) {
                        result.push(f);
                    }
                }
            } catch (fs_error) {
                __errors_handler('__get_files_list:forEach', fs_error);
                return;
            }
        });
        callback(result);
    });
}

function __watch_path_onsocket(event_name, socket, data, watch_path, updater) {
    socket.get('watchers', function (err, socket_watchers) {
        if (!socket_watchers) {
            // init socket watchers
            socket_watchers = {};
        }
        try {
            var watcher = socket_watchers[event_name];
            if (watcher)
                watcher.close();

            fs.stat(watch_path, function (err, stats) {
                if (err) {
                    __errors_handler('__watch_path_onsocket:fs.stat', err, socket);
                    return;
                }
                if (stats.isDirectory()) {
                    watcher = fs.watch(watch_path, {
                        persistent: true
                    }, function (event, fileName) {
                        if (event == 'rename')
                            updater(event_name, socket, data);
                    });
                } else if (stats.isFile()) {
                    watcher = new Tail(watch_path);
                    watcher.on('line', function (new_content, tailInfo) {
                        data.file.new_content = new_content + '\n';
                        updater(event_name, socket, data);
                    });
                    watcher.on('error', function (msg) {
                        socket.emit(config.events.error, msg);
                    });
                }
                socket_watchers[event_name] = watcher;
                socket.set('watchers', socket_watchers);
            });
        } catch (err) {
            __errors_handler('__watch_path_onsocket <- ' + arguments.callee.caller.name, err, socket);
            return;
        }
    });
}

function __generic_handler_watcher(event_name, socket, data, watch_path, callback) {
    callback(event_name, socket, data);
    __watch_path_onsocket(event_name, socket, data, watch_path, callback);
}

function __send_distributions(socket) {
    __get_files_list(config.debomatic.path, true, function (directories) {
        var distributions = [];
        directories.forEach(function (dir) {
            var data = {};
            data.distribution = {};
            data.distribution.name = dir;
            var pool_path = __get_distribution_pool_path(data);
            if (fs.existsSync(pool_path)) {
                distributions.push(dir);
            }
        });
        socket.emit(config.events.broadcast.distributions, distributions);
    });
}

var utils = {
    check_data_distribution: function (data) {
        return __check_data_distribution(data);
    },
    check_data_package: function (data) {
        return __check_data_package(data);
    },
    check_data_file: function (data) {
        return __check_data_file(data);
    },
    get_distribution_pool_path: function (data) {
        return __get_distribution_pool_path(data);
    },
    get_package_path: function (data) {
        return __get_package_path(data);
    },
    get_file_path: function (data) {
        return __get_file_path(data);
    },
    get_files_list: function (dir, onlyDirectories, callback) {
        return __get_files_list(dir, onlyDirectories, callback);
    },
    watch_path_onsocket: function (event_name, socket, data, watch_path, updater) {
        return __watch_path_onsocket(event_name, socket, data, watch_path, updater);
    },
    generic_handler_watcher: function (event_name, socket, data, watch_path, callback) {
        return __generic_handler_watcher(event_name, socket, data, watch_path, callback);
    },
    send_distributions: function (socket) {
        return __send_distributions(socket);
    },
    errors_handler: function (from, error, socket) {
        return __errors_handler(from, error, socket);
    }
};

module.exports = utils;
