'use strict';

/* global Utils: false */
/* global Chartist: false */
/* global debug: false */
/* global debug_socket: false */
/* global dom_history: false */

function Page_History() {

    var distributions_counter = {};

    // init table
    for (var i = 0; i < dom_history.length; i++) {
        var p = dom_history[i];
        if (distributions_counter.hasOwnProperty(p.distribution))
            distributions_counter[p.distribution]++;
        else distributions_counter[p.distribution] = 1;
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

    // build the graphs
    var distributions_data = {
        series: [],
        labels: []
    };

    for (var distro in distributions_counter) {
        if (distributions_counter.hasOwnProperty(distro)) {
            distributions_data.series.push(distributions_counter[distro]);
            distributions_data.labels.push(distro + " (" + distributions_counter[distro] + ")");
        }
    }

    Chartist.Pie('#distributions-chart', distributions_data, {
        donut: true,
        donutWidth: 20,
    });

}
