'use strict';

/* global Utils: false */
/* global Chartist: false */
/* global debug: false */
/* global debug_socket: false */
/* global dom_history: false */

function Page_History() {

    var distributions_counter = {};
    var days_counter = {};
    var all_days = {};

    function _get_short_day(timestamp) {
        var date = new Date(timestamp * 1000);
        var locale = navigator.language || 'en-US';
        var options = {
            month: "numeric",
            day: "numeric",
        };
        return date.toLocaleDateString(locale, options);
    }

    // init table and some objects
    for (var i = 0; i < dom_history.length; i++) {
        var p = dom_history[i];
        var day = _get_short_day(p.start);
        // count total packages by distributions
        if (distributions_counter.hasOwnProperty(p.distribution))
            distributions_counter[p.distribution]++;
        else distributions_counter[p.distribution] = 1;
        if (days_counter.hasOwnProperty(p.distribution)) {
            if (days_counter[p.distribution].hasOwnProperty(day))
                days_counter[p.distribution][day]++;
            else
                days_counter[p.distribution][day] = 1;
        } else {
            days_counter[p.distribution] = {};
            days_counter[p.distribution][day] = 1;
        }
        all_days[day] = 0;
        var info = Utils.get_status_icon_and_class(p);
        var label = info.label || 'building';
        var distribution_url = Utils.get_url_to_package({
            'distribution': p.distribution
        });
        var row = '<tr>';
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

    // build the distribution Pie graph
    var distributions_data = {
        series: [],
        labels: []
    };
    var all_distibutions = [];
    for (var distro in distributions_counter) {
        if (distributions_counter.hasOwnProperty(distro)) {
            distributions_data.series.push(distributions_counter[distro]);
            distributions_data.labels.push(distro + " (" + distributions_counter[distro] + ")");
            all_distibutions.push(distro);
        }
    }

    Chartist.Pie('#distributions-chart', distributions_data, {
        donut: true,
        donutWidth: 15,
    });

    // build the days Line graph
    var days_data = {
        series: [],
        labels: []
    };
    for (var day in all_days) {
        if (all_days.hasOwnProperty(day))
            days_data.labels.push(day);
    }
    for (var i = 0; i < all_distibutions.length; i++) {
        var info = [];
        var distro = all_distibutions[i];
        for (var day in all_days) {
            if (!all_days.hasOwnProperty(day))
                continue;
            if (days_counter[distro].hasOwnProperty(day))
                info.push(days_counter[distro][day]);
            else
                info.push(0);
        }
        days_data.series.push(info);
    }
    Chartist.Line('#days-chart', days_data);
}
