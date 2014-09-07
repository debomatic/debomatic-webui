'use strict';

/* global Utils: false */
/* global page_generic: false */
/* global debug: false */
/* global debug_socket: false */
/* global dom_history: false */

function Page_History() {
    for (var i = 0; i < dom_history.length; i++) {
        var p = dom_history[i];
        var row = '<tr>';
        row += '<td>' + p.distribution + '</td>';
        row += '<td>' + p.package + '</td>';
        row += '<td>' + p.uploader + '</td>';
        row += '<td>' + p.start + '</td>';
        row += '<td>' + p.end + '</td>';
        row += '<td>' + p.status + '</td>';
        row += '</tr>';
        $('.table tbody').append(row);
    }
}
