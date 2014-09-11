'use strict';

/* global Utils: false */
/* global Chartist: false */
/* global debug: false */
/* global debug_socket: false */
/* global dom_history: false */

function Page_History() {

    var distributions_counter = {};
    var days_counter = {};
    var all_distributions = [];
    var all_days = [];

    function _get_short_day(timestamp) {
        var date = new Date(timestamp * 1000);
        var locale = navigator.language || 'en-US';
        var options = {
            month: "numeric",
            day: "numeric",
        };
        return date.toLocaleDateString(locale, options);
    }

    function _get_id(package_status) {
        var p = package_status;
        return "package/" + p.distribution + "/" + p.package;
    }

    function _add_row(package_status) {
        var p = package_status;
        if (!p.hasOwnProperty('success'))
            return;
        var info = Utils.get_status_icon_and_class(p);
        var label = info.label || 'building';
        var distribution_url = Utils.get_url_to_package({
            'distribution': p.distribution
        });
        var row = '<tr id="' + _get_id(package_status) + '">';
        var package_url = Utils.get_url_to_package(p);
        row += '<td><a href="' + distribution_url + '">' + p.distribution + '</a></td>';
        row += '<td><a href="' + package_url + '">' + p.package + '</td>';
        row += '<td>' + Utils.format_time(p.start, false, true) + '</td>';
        row += '<td>' + Utils.format_time(p.end, false, true) + '</td>';
        row += '<td>' + p.uploader + '</td>';
        row += '<td class="' + info.className + ' text-' + info.className + '">' + label + '</td>';
        row += '</tr>';
        $('table tbody').append(row);
    }

    function _count_distributions(package_status) {
        var p = package_status;
        if (distributions_counter.hasOwnProperty(p.distribution))
            distributions_counter[p.distribution]++;
        else distributions_counter[p.distribution] = 1;
        if (all_distributions.indexOf(p.distribution) < 0)
            all_distributions.push(p.distribution);
    }

    function _count_days(package_status) {
        var p = package_status;
        var day = _get_short_day(p.start);
        if (days_counter.hasOwnProperty(p.distribution)) {
            if (days_counter[p.distribution].hasOwnProperty(day))
                days_counter[p.distribution][day]++;
            else
                days_counter[p.distribution][day] = 1;
        } else {
            days_counter[p.distribution] = {};
            days_counter[p.distribution][day] = 1;
        }
        if (all_days.indexOf(day) < 0)
            all_days.push(day);
    }

    function _sort_table() {
        // create the theme for tablesorter
        $.extend($.tablesorter.themes.bootstrap, {
            table: 'table table-condensed table-bordered table-striped',
            caption: 'caption',
            header: 'bootstrap-header',
            sortNone: 'bootstrap-icon-unsorted',
            sortAsc: 'glyphicon glyphicon-chevron-up',
            sortDesc: 'glyphicon glyphicon-chevron-down',
        });

        // call the tablesorter plugin and apply the uitheme widget
        $("table").tablesorter({
            theme: "bootstrap",
            widthFixed: true,
            headerTemplate: '{content} {icon}',
            widgets: ["uitheme", "filter"],
            sortList: [
                [3, 1]
            ]
        });

        // add some fancy class to input fields
        $("table input").addClass('form-control');
        $("table select").addClass('form-control');

    }

    function _create_graph_distributions() {
        // build the distribution Pie graph
        var distributions_data = {
            series: [],
            labels: []
        };
        for (var i = 0; i < all_distributions.length; i++) {
            var distro = all_distributions[i];
            distributions_data.series.push(distributions_counter[distro]);
            distributions_data.labels.push(distro + " (" + distributions_counter[distro] + ")");
        }
        Chartist.Pie('#distributions-chart', distributions_data, {
            donut: true,
            donutWidth: 15,
            chartPadding: 15,
            labelOffset: 15,
            labelDirection: 'explode',
        });
    }

    function _create_graph_days() {
        // build the days Line graph
        var days_data = {
            series: [],
            labels: all_days
        };
        for (var i = 0; i < all_distributions.length; i++) {
            var info = [];
            var distro = all_distributions[i];
            for (var j = 0; j < all_days.length; j++) {
                var day = all_days[j];
                if (days_counter[distro].hasOwnProperty(day))
                    info.push(days_counter[distro][day]);
                else
                    info.push(0);
            }
            days_data.series.push(info);
        }
        Chartist.Line('#days-chart', days_data);
    }

    this.start = function (socket) {
        socket.on(config.events.broadcast.status_update, function (socket_data) {
            // TODO - implements _update_table
        });
    };


    // init table and some objects
    for (var i = 0; i < dom_history.length; i++) {
        var p = dom_history[i];
        _add_row(p);
        // count stats
        _count_distributions(p);
        _count_days(p);
    }
    all_distributions.sort();
    _sort_table();
    _create_graph_distributions();
    _create_graph_days();
}
