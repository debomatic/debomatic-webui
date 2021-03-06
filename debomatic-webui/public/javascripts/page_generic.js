/* global Utils: false */
/* global debug_socket: false */
'use strict';

function Page_Generic() {
    var _e = config.events;
    var status_debomatic = {};

    function __get_status_html_id(status_data) {
        var result = 'status-' + status_data.status + '-' + status_data.distribution;
        if (status_data.hasOwnProperty('package'))
            result += '-' + status_data.package;
        return result;
    }

    function __get_status_html_title(status_data) {
        var result = status_data.status + ': ' + status_data.distribution;
        if (status_data.hasOwnProperty('package'))
            result += ' > ' + status_data.package;
        if (status_data.hasOwnProperty('uploader') && status_data.uploader.length > 0)
            result += ' by ' + status_data.uploader;
        return result;
    }

    function __get_status_html_inner(status_data) {
        if (status_data.hasOwnProperty('package'))
            return status_data.package;
        return status_data.distribution;
    }

    function __get_status_html(status_data) {
        var _s = status_data;
        var li = $('<li></li>');
        li.attr('id', __get_status_html_id(status_data));
        var button = $('<a></a>');
        button.addClass('btn btn-xs');
        button.addClass(_s.status);
        button.attr('title', __get_status_html_title(_s));
        button.attr('href', Utils.get_url_to_package(_s));
        button.html(__get_status_html_inner(_s));
        var info = Utils.get_status_icon_and_class(_s);
        button.addClass('btn-' + info.className);
        // add icon
        button.html(button.html() + ' ' + Utils.get_status_icon_html(_s));
        li.html(button);
        var result = $('<div></div>');
        result.html(li);
        return result.html();
    }

    var distributions = {
        set: function (distributions) {
            $('#distributions ul').html('');
            if (distributions.length < 1) {
                $('#distributions ul').append('<li><a title="There is no distribution at the moment" onclick="return false">None</li>');
            } else {
                distributions.forEach(function (name) {
                    $('#distributions ul').append('<li id="distribution-' + name + '"><a href="' + config.paths.distribution + '#' + name + '">' + name + '</a></li>');
                });
                if (window.location.pathname == config.paths.distribution) {
                    var data = Utils.from_hash_to_view();
                    if (Utils.check_view_distribution(data)) {
                        $('#distributions li[id="distribution-' + data.distribution.name + '"]').addClass('active');
                    }
                }
            }
        },
    };

    var status = {
        set: function (data_status) {
            if (!data_status) {
                if ($('#status li').length === 0) {
                    if (status_debomatic.running) {
                        $('#status .idle').show();
                        $('#status .norunning').hide();
                    } else {
                        $('#status .idle').hide();
                        $('#status .norunning').show();
                    }
                }
            } else {
                $('#status ul').html('');
                if (data_status.length > 0) {
                    data_status.forEach(function (s) {
                        status.append(s);
                    });
                }
            }
        },
        append: function (status_data) {
            $('#status .debomatic').hide();
            $('#status ul').append(__get_status_html(status_data));
        },
        update: function (status_data) {

            var li = $('#status li[id="' + __get_status_html_id(status_data) + '"]');
            if (li.length > 0 && status_data.hasOwnProperty('success')) {
                // Update color and icon
                li = $(li[0]);
                li.html($(__get_status_html(status_data)).children());
                li.attr('id', '');
                // This is a chain to have a fadeOut and correctly
                // delete status li from list.
                // The first timemout fades out the status element.
                setTimeout(function () {
                    li.children().fadeOut(config.status.delay.fadeOut);
                    // Then resize list.
                    setTimeout(function () {
                        li.animate({
                            width: 'toggle'
                        });
                    }, config.status.delay.fadeOut);
                    // Finally remove status html
                    // and show idle label if necessary.
                    setTimeout(function () {
                        li.remove();
                        if ($('#status li').length === 0) {
                            status.set();
                        }
                    }, config.status.delay.remove + 2000); // more delay on remove html
                }, config.status.delay.remove);
            } else if (!status_data.hasOwnProperty('success')) {
                status.append(status_data);
            }
        },
    };

    this.preferences = function () {
        var bootstrap_theme_css = '/external_libs/bootstrap-3.3.2/css/bootstrap-theme.min.css';
        if (config.preferences.glossy_theme) {
            if ($('head').find('link[href="' + bootstrap_theme_css + '"]').length === 0)
                $('head').append('<link rel="stylesheet" href="' + bootstrap_theme_css + '">');
        } else {
            $('head').find('link[href="' + bootstrap_theme_css + '"]').remove();
        }
    };

    this.set_window_title = function (label) {
        var window_title_separator = ' \u00ab ';
        if (label)
            window.document.title = label + window_title_separator + config.title;
        else
            window.document.title = config.title;
    };

    this.start = function (socket) {
        // update distributions
        socket.on(_e.broadcast.distributions, function (socket_distributions) {
            debug_socket('received', _e.broadcast.distributions, socket_distributions);
            distributions.set(socket_distributions);
        });

        socket.on(_e.client.status, function (socket_status) {
            debug_socket('received', _e.client.status, socket_status);
            status.set(socket_status);
        });

        socket.on(_e.broadcast.status_update, function (package_status) {
            debug_socket('received', _e.broadcast.status_update, package_status);
            status.update(package_status);
        });

        socket.on(_e.broadcast.status_debomatic, function (socket_status_debomatic) {
            debug_socket('received', _e.broadcast.status_debomatic, socket_status_debomatic);
            status_debomatic = socket_status_debomatic;
            status.set();
        });

        socket.on(_e.error, function (error) {
            console.error('socket > ' + error);
        });
    };

    // select current page in navbar
    if (window.location.pathname != config.paths.distribution) {
        $('.navbar li a[href="' + window.location.pathname + '"]').parent().addClass('active');
    }

    // update html according with preferences
    this.preferences();

    // show the smile face
    $('#footer .copyright a').mouseenter(function () {
        $('#smile').delay(250).animate({
            'background-position-y': '-50px'
        }, 200);
    }).mouseleave(function () {
        $('#smile').stop().stop().animate({
            'background-position-y': '20px'
        }, 150);
    });
}
