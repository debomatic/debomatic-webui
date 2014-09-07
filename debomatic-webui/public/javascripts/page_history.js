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
        var row = '<tr>';
        row += '<td>' + p.distribution + '</td>';
        row += '<td>' + p.package + '</td>';
        row += '<td>' + p.uploader + '</td>';
        row += '<td>' + Utils.format_time(p.start) + '</td>';
        row += '<td>' + Utils.format_time(p.end) + '</td>';
        row += '<td>' + p.status + '</td>';
        row += '</tr>';
        $('.table tbody').append(row);
    }
}
