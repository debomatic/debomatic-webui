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
        row += '<td>' + p.uploader + '</td>';
        row += '<td>' + Utils.format_time(p.start) + '</td>';
        row += '<td>' + Utils.format_time(p.end) + '</td>';
        row += '<td class="' + info.className + ' text-' + info.className + '">' + label + '</td>';
        row += '</tr>';
        $('.table tbody').append(row);
    }
}
