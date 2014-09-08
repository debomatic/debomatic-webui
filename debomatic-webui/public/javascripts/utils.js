'use strict';

var Utils = {
    from_hash_to_view: function (hash) {
        if (!hash)
            hash = window.location.hash;
        hash = hash.replace('#', '');
        var info = hash.split('/');
        var view = {};
        view.distribution = {};
        view.packages = {};
        view.package = {};
        view.file = {};

        if (info.length >= 1) {
            view.distribution.name = info[0];
        }
        if (info.length >= 3) {
            view.package.name = info[1];
            view.package.version = info[2];
            view.package.orig_name = view.package.name + '_' + view.package.version;
        }
        if (info.length >= 4) {
            view.file.name = info[3];
            view.file.orig_name = view.package.orig_name + '.' + view.file.name;
        }
        return view;
    },

    from_view_to_hash: function (view) {
        var hash = '#';
        if (Utils.check_view_distribution(view)) {
            hash = hash + view.distribution.name;
            if (Utils.check_view_package(view)) {
                hash = hash + '/' + view.package.name + '/' + view.package.version;
                if (Utils.check_view_file(view))
                    hash = hash + '/' + view.file.name;
            }
        }
        return hash;
    },

    check_view_distribution: function (view) {
        return view && view.distribution && view.distribution.name;
    },

    check_view_package: function (view) {
        return Utils.check_view_distribution(view) && view.package && view.package.name && view.package.version && view.package.orig_name;
    },

    check_view_file: function (view) {
        return Utils.check_view_package(view) && view.file && view.file.name;
    },

    get_status_icon_and_class: function (status_data) {
        var _c = config.status.className;
        var _i = config.status.icons;
        var _s = status_data;
        var className = null;
        var icon = null;
        var label = null;
        if (_s.hasOwnProperty('success')) {
            if (_s.success === true) {
                className = _c.success;
                icon = _i.success;
                label = 'success';
            } else {
                className = _c.fail;
                icon = _i.fail;
                label = 'fail';
            }
        } else {
            className = _c[_s.status];
            icon = _i[_s.status];
        }

        // do not change color if update or create and successed
        if (_s.success === true &&
            _s.status != config.status.build) {
            className = _c[_s.status];
        }

        return {
            className: className,
            icon: icon,
            label: label
        };
    },

    get_status_icon_html: function (status_data) {
        var info = Utils.get_status_icon_and_class(status_data);
        return '<span class="icon glyphicon glyphicon-' + info.icon + '"></span>';
    },

    // clone an object via JSON
    clone: function (object) {
        return JSON.parse(JSON.stringify(object));
    },

    // escape html entities
    escape_html: function (string) {
        return String(string).replace(/[&<>"'\/]/g, function (s) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#39;",
                "/": "&#x2F;"
            }[s];
        });
    },

    // returns a two digits num
    num_two_digits: function (num) {
        return ("0" + num).slice(-2);
    },

    // format time from a timestamp
    format_time: function (timestamp, time_in_bold, short) {
        if (!timestamp)
            return '';
        var date = new Date(timestamp * 1000);
        var locale = navigator.language || 'en-US';
        var options = null;
        if (short)
            options = {
                year: "numeric",
                month: "numeric",
                day: "numeric",
            };
        else
            options = {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            };
        var result_date = date.toLocaleDateString(locale, options);
        var result_time = Utils.num_two_digits(date.getHours()) + ':' + Utils.num_two_digits(date.getMinutes());
        if (time_in_bold) result_time = '<b>' + result_time + '</b>';
        return result_date + ' ' + result_time;
    },

    // get href url from status object
    get_url_to_package: function (status_data) {
        var result = config.paths.distribution + '#' + status_data.distribution;
        if (status_data.hasOwnProperty('package'))
            result += '/' + status_data.package.replace('_', '/') + '/buildlog';
        return result;
    }

};
