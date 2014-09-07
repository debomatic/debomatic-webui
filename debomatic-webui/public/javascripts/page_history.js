'use strict';

/* global Utils: false */
/* global page_generic: false */
/* global debug: false */
/* global debug_socket: false */
/* global dom_history: false */

function Page_History() {

    // init table
    for (var i = 0; i < dom_history.length; i++) {
        var p = dom_history[i];
        var info = Utils.get_status_icon_and_class(p);
        var label = info.label || 'building';
        var row = '<tr>';
        var distribution_url = Utils.get_url_to_package({
            'distribution': p.distribution
        });
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

    // add some funcy class to inputs field
    $("table input").addClass('form-control');
    $("table select").addClass('form-control');
}
