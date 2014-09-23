'use strict';

/* global Utils: false */
/* global Chartist: false */
/* global debug: false */
/* global debug_socket: false */
/* global socket: false */

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
        var row = '<tr class="package" id="' + _get_id(package_status) + '">';
        var package_url = Utils.get_url_to_package(p);
        row += '<td class="distribution"><a href="' + distribution_url + '">' + p.distribution + '</a></td>';
        row += '<td class="package"><a href="' + package_url + '">' + p.package + '</td>';
        row += '<td class="start">' + Utils.format_time(p.start, false, true) + '</td>';
        row += '<td class="end">' + Utils.format_time(p.end, false, true) + '</td>';
        row += '<td class="uploader">' + p.uploader + '</td>';
        row += '<td class="status ' + info.className + ' text-' + info.className + '">' + label + '</td>';
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
            table: 'table table-condensed table-bordered',
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
            sortList: [
                [3, 1]
            ],
            widgets: ["uitheme", "filter", "zebra"],
            widgetOptions: {
                zebra: ["normal-row", "alt-row"],
            }
        });

        // add some fancy class to input fields
        $("table input").addClass('form-control');
        $("table select").addClass('form-control');

    }

    // add tooltip to graphs
    function _create_graph_tooltip(graph, element, suffix_value) {
        var $chart = $(graph);
        var $toolTip = $chart
            .append('<div class="tooltip fade top in" role="tooltip">' +
                '<div class="tooltip-arrow"></div> ' +
                '<div class="tooltip-inner"></div>' +
                '</div>').find('.tooltip').hide();

        $chart.on('mousemove', function (event) {
            $toolTip.css({
                left: event.offsetX - $toolTip.width() / 2,
                top: event.offsetY - $toolTip.height() - 20
            });
        });
        $chart.on('mouseenter', element, function () {
            var $point = $(this),
                value = $point.attr('ct:value'),
                seriesName = $point.parent().attr('ct:series-name');
            if (suffix_value)
                value = value + " " + suffix_value;
            $toolTip.find('.tooltip-inner').html(seriesName + ' (' + value + ')');
            $toolTip.show();
        });

        $chart.on('mouseleave', element, function () {
            $toolTip.hide();
        });
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
            days_data.series.push({
                name: distro,
                data: info
            });
        }
        Chartist.Line('#days-chart', days_data);
        _create_graph_tooltip("#days-chart", '.ct-point');

        var $chart = $('#days-chart');
        var effect = function (x, t, b, c, d) {
            return -c * (t /= d) * (t - 2) + b;
        };

        $chart.on('mouseenter', '.ct-point', function () {
            $(this).stop().animate({
                'stroke-width': '20px'
            }, 200, effect);
        });

        $chart.on('mouseleave', '.ct-point', function () {
            $(this).stop().animate({
                'stroke-width': '10px'
            }, 150, effect);
        });
    }

    function _create_graph_disk(socket_data) {
        var distributions = [];
        var subdirs = [];
        var data = {};
        var total_sizes = {};
        var series = [];
        var labels = [];
        for (var distribution in socket_data) {
            if (distribution == 'size') {
                var total_size_in_gb = Number(socket_data.size / 1000).toFixed(1);
                $("#disk-usage .total-size").text(total_size_in_gb + ' GB');
                continue;
            }
            distributions.push(distribution);
        }
        distributions.sort();
        for (var i = 0; i < distributions.length; i++) {
            distribution = distributions[i];
            for (var subdir in socket_data[distribution]) {
                if (subdir == 'size') {
                    total_sizes[distribution] = socket_data[distribution].size;
                    continue;
                }
                if (!data.hasOwnProperty(subdir)) {
                    subdirs.push(subdir);
                    data[subdir] = [];
                }
                data[subdir].push(socket_data[distribution][subdir]);
            }
        }
        for (i = 0; i < subdirs.length; i++) {
            series.push({
                name: subdirs[i],
                data: data[subdirs[i]]
            });
        }

        var options = {
            seriesBarDistance: 12
        };

        Chartist.Bar('#disk-chart', {
            labels: distributions,
            series: series
        }, options);
        _create_graph_tooltip("#disk-chart", '.ct-bar', "MB");

        // WORKAROUND: add total spaces to label
        // wating for support multilines for label in chartist-js
        // https://github.com/gionkunz/chartist-js/issues/25
        $('#disk-chart svg').height("+=20");
        $('#disk-chart .ct-label.ct-horizontal').each(function (index, elem) {
            var size = document.createElementNS("http://www.w3.org/2000/svg", 'text');
            var currentY = Number(elem.getAttribute('dy'));
            size.setAttribute('dx', Number(elem.getAttribute('dx')));
            size.setAttribute('dy', currentY + 15);
            size.setAttribute('class', 'ct-label ct-horizontal ct-size');
            size.textContent = total_sizes[elem.textContent] + " MB";
            elem.parentNode.appendChild(size);
        });

    }

    function _exportTableToCSV($table, filename) {
        // code from http://jsfiddle.net/terryyounghk/KPEGU/
        var $rows = $table.find('tr.package:visible:has(td)'),

            // Temporary delimiter characters unlikely to be typed by keyboard
            // This is to avoid accidentally splitting the actual contents
            tmpColDelim = String.fromCharCode(11), // vertical tab character
            tmpRowDelim = String.fromCharCode(0), // null character

            // actual delimiter characters for CSV format
            colDelim = '","',
            rowDelim = '"\r\n"',

            // Grab text from table into CSV formatted string
            csv = '"' + $rows.map(function (i, row) {
                var $row = $(row),
                    $cols = $row.find('td');

                return $cols.map(function (j, col) {
                    var $col = $(col),
                        text = $col.text();

                    return text.replace('"', '""'); // escape double quotes

                }).get().join(tmpColDelim);

            }).get().join(tmpRowDelim)
            .split(tmpRowDelim).join(rowDelim)
            .split(tmpColDelim).join(colDelim) + '"',

            // Data URI
            csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

        $(this)
            .attr({
                'download': filename,
                'href': csvData,
                'target': '_blank'
            });
    }



    this.start = function (socket) {
        socket.on(config.events.broadcast.status_update, function (socket_data) {
            // TODO - implements _update_table
        });

        socket.on(config.events.client.history, function (socket_data) {
            debug_socket('received', config.events.client.history, socket_data);
            distributions_counter = {};
            days_counter = {};
            all_distributions = [];
            all_days = [];
            $('#history .tbody').html('');
            // init table and some objects
            for (var i = 0; i < socket_data.length; i++) {
                var p = socket_data[i];
                _add_row(p);
                // count stats
                _count_distributions(p);
                _count_days(p);
            }
            all_distributions.sort();
            _sort_table();
            _create_graph_distributions();
            _create_graph_days();
            $('.body').fadeIn("fast");
        });

        socket.on(config.events.client.disk_usage, function (socket_data) {
            debug_socket('received', config.events.client.disk_usage, socket_data);
            _create_graph_disk(socket_data);
        });

        debug_socket('emit', config.events.client.history, '');
        socket.emit(config.events.client.history);

        debug_socket('emit', config.events.client.disk_usage, '');
        socket.emit(config.events.client.disk_usage);
    };

    // active downlaod tooltip
    $("[data-toggle='popover']").popover();
    $('#download').on('click', function () {
        _exportTableToCSV.apply(this, [$('#history'), 'history.csv']);
    });
}
