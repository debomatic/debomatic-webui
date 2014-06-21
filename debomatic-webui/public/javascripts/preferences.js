/* global debug: false */
/* global page_generic: false */
'use strict';

function Preferences() {

    // update config.preferences according with user choices
    var load = function () {
        for (var key in config.preferences) {
            var value = localStorage.getItem(key);
            if (value) {
                debug(2, 'loading preference', key, value);
                config.preferences[key] = JSON.parse(value);
            }
        }
    };

    // set prefence
    var set = function (key, value) {
        if (config.preferences.hasOwnProperty(key)) {
            debug(1, 'setting preference', key, value);
            localStorage.setItem(key, value);
            config.preferences[key] = JSON.parse(value);
        }
    };

    // init prefence page
    this.initPage = function () {

        page_generic.set_window_title('Preferences');

        // set view according with config.preferences
        for (var key in config.preferences) {
            var element = $('#preferences #' + key);
            if (element.attr('type') == 'checkbox') {
                element.prop('checked', config.preferences[key]);
            } else {
                element.val(config.preferences[key]);
            }
        }

        // on input change, set prefence
        $('#preferences input, #preferences select').change(function () {
            var key = $(this).attr('id');
            var value = $(this).val();
            if ($(this).attr('type') == 'checkbox')
                value = $(this).is(':checked');
            set(key, value);
            // give to user an immediate feedback changing preferences
            page_generic.preferences();
        });
    };

    load();

}
