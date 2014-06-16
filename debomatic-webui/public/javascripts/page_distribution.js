'use strict';

/* global debug: false */
/* global page_generic: false */

// function to get all files in on click
// event comes from HTML
function download_all(div_id) {
    var frame_id = 'downloadAllFrame';
    var frame = null;
    if ($('#' + frame_id).length > 0)
        frame = $($('#' + frame_id)[0]);
    else {
        frame = $('<iframe></iframe>');
        frame.hide();
        frame.attr('id', frame_id);
        $('body').append(frame);
    }
    var files = $(div_id).find('ul li a');
    $.each(files, function (index, item) {
        setTimeout(function () {
            frame.attr('src', item.href);
        }, index * 1000);
    });
}

function Page_Distrubion(socket) {

    /*

      General Objects description:

      The current view:

      view = {}
      view.distribution                       --- the selected distribution
      view.distribution.name
      view.packages         = {package}
      view.package                            --- the selected package
      view.package.name
      view.package.version
      view.package.orig_name
      view.package.status
      view.package.success
      view.package.files    = [file]
      view.package.debs     = [file]
      view.package.sources  = [file]
      view.file                               --- the selected file
      view.file.name
      view.file.content
      view.file.path
      view.file.extension
      view.file.orig_name

      More info on Utils.from_hash_to_view()


      The status object received by socket:

      status_data = {}
      status_data.distribution                --- the distribution name
      status_data.package                     --- the package name as name_version
      status_data.status                      --- one of config.status.[build|create|update]
      status_data.success                     --- true | false

    */

    var _e = config.events.client;
    var view = Utils.from_hash_to_view();
    var sidebarOffset = 0;
    var new_lines = [];
    var current_file_in_preview = false;

    function __check_hash_makes_sense() {
        if (window.location.hash.indexOf('..') >= 0) {
            error.set('Detected ".." God Is Watching You !');
            return false;
        }
        if (!window.location.hash) {
            welcome.show();
            return false;
        }
        var info = window.location.hash.split('/');
        if (info.length == 2)
            window.location.hash = info[0];
        return true;
    }

    var title = {
        set: function (label) {
            if (label) {
                $('#title').html(label);
                page_generic.set_window_title(label);
                return;
            }
            label = '';
            var window_title = null;
            if (Utils.check_view_file(view)) {
                var complete_name = view.package.orig_name + '.' + view.file.name;
                window_title = complete_name;
                label = complete_name;
                if (!view.file.path)
                    view.file.path = config.paths.debomatic + '/' + view.distribution.name + '/pool/' + view.package.orig_name + '/' + complete_name;
                label += ' <a class="btn btn-link btn-lg" data-toggle="tooltip" title="Download" href="' + view.file.path + '"> ' +
                    '<span class="glyphicon glyphicon-download-alt"></span></a>';
                if (current_file_in_preview) {
                    var view_all = $('<a id="get-whole-file" data-toggle="tooltip" class="btn btn-link btn-lg" title="View the whole file"></a>');
                    view_all.html('<span class="glyphicon glyphicon-eye-open"></span>');
                    label += view_all.get(0).outerHTML;
                }

            } else if (Utils.check_view_package(view))
                label = view.package.orig_name;
            else if (Utils.check_view_distribution(view))
                label = view.distribution.name;
            $('#title').html(label);
            if (window_title)
                label = window_title;
            page_generic.set_window_title(label);

            // set onclick get-whole-file
            $("#get-whole-file").on('click', function () {
                debug(1, "get the whole file");
                file.get(true);
                $(this).fadeOut('fast');
            });
        },
        clean: function () {
            $('#title').html('');
            page_generic.set_window_title();
        }
    };

    var packages = {
        set: function (socket_data) {
            packages.clean();
            var tmp = Utils.clone(socket_data);
            tmp.file = null;
            view.packages = {};
            if (socket_data.distribution.packages && socket_data.distribution.packages.length > 0) {
                socket_data.distribution.packages.forEach(function (p) {
                    tmp.package = p;
                    // get buildlog if package is clicked
                    $('#packages ul').append('<li id="package-' + p.orig_name + '"><a href="' +
                        Utils.from_view_to_hash(tmp) + '/buildlog"><span class="name">' + p.name + '</span> ' +
                        '<span class="version">' + p.version + '</span></a></li>');
                    view.packages[p.orig_name] = Utils.clone(p);
                });
                packages.select();
            } else {
                $('#packages ul').append('<li class="text-muted">No packages yet</li>');
            }
            packages.show();
            sticky.updateOffset();
        },
        clean: function () {
            $('#packages ul').html('');
            $('#packages .search').val('');
        },
        get: function () {
            if (Utils.check_view_distribution(view)) {
                var query_data = {};
                query_data.distribution = view.distribution;
                debug_socket('emit', _e.distribution_packages, query_data);
                socket.emit(_e.distribution_packages, query_data);
            }
        },
        select: function () {
            packages.unselect();
            if (Utils.check_view_package(view)) {
                $('#packages li[id="package-' + view.package.orig_name + '"]').addClass('active');
            }
            packages.search();
        },
        unselect: function () {
            $('#packages li').removeClass('active');
        },
        set_status: function (status_data) {
            // set status in view
            if (view.distribution.name == status_data.distribution && view.packages[status_data.package]) {
                view.packages[status_data.package].status = status_data.status;
                if (status_data.hasOwnProperty('success'))
                    view.packages[status_data.package].success = status_data.success;
                else
                    delete(view.packages[status_data.package].success);
            }
            // and in html
            var p_html = $('#packages li[id="package-' + status_data.package + '"] a');
            p_html.find('span.icon').remove();
            p_html.append(Utils.get_status_icon_html(status_data));
            if (Utils.check_view_package(view) && view.package.orig_name == status_data.package && view.distribution.name == status_data.distribution) {
                // in case user is watching this package, update also view.package
                view.package = Utils.clone(view.packages[status_data.package]);
            }
        },
        show: function () {
            $('#packages').show();
        },
        hide: function () {
            $('#packages').hide();
        },
        search: function (token) {
            if (!token)
                token = $("#packages .search").val();
            if (!token) {
                debug(2, "packages search token empty - showing all");
                $("#packages li").show();
            } else {
                $("#packages li").not('.active').each(function (index) {
                    var p_name = $(this).find('a span.name').text();
                    if (p_name.indexOf(token) < 0) {
                        debug(2, "packages search token:", token, "hiding:", this);
                        $(this).hide();
                    } else {
                        debug(2, "packages search token:", token, "showing:", this);
                        $(this).show();
                    }
                });
            }
            sticky.updateOffset();
        }
    };

    var files = {
        set: function (socket_data) {
            files.clean();
            var tmp = Utils.clone(socket_data);
            if (socket_data.package.files && socket_data.package.files.length > 0) {
                // update view
                view.package.files = Utils.clone(socket_data.package.files);
                // update html
                socket_data.package.files.forEach(function (f) {
                    tmp.file = f;
                    var html_file = $('<li id="file-' + f.orig_name + '"><a title="' + f.orig_name + '" href="' +
                        Utils.from_view_to_hash(tmp) + '">' + f.name + '</a></li>');
                    html_file.on('click', function () {
                        files.select(this);
                    });
                    $('#logs ul').append(html_file);
                });
                $('#logs').show();
                files.select();
            }

            if (socket_data.package.debs && socket_data.package.debs.length > 0) {
                // update view
                view.package.debs = Utils.clone(socket_data.package.debs);
                // update.html
                socket_data.package.debs.forEach(function (f) {
                    $('#debs ul').append('<li><a title="' + f.orig_name + '" href="' + f.path + '">' +
                        f.name + '</a> <span>.' + f.extension + '</span></li>');
                });
                $('#debs').show();
            }

            if (socket_data.package.sources && socket_data.package.sources.length > 0) {
                // update view
                view.package.sources = Utils.clone(socket_data.package.sources);
                // update html
                socket_data.package.sources.forEach(function (f) {
                    $('#sources ul').append('<li><a title="' + f.orig_name + '" href="' + f.path + '">' + f.name + '</a></li>');
                });
                $('#sources').show();
            }
            files.show();
            sticky.updateOffset();
        },
        clean: function () {
            $('#logs ul').html('');
            $('#logs').hide();
            $('#debs ul').html('');
            $('#debs').hide();
            $('#sources ul').html('');
            $('#sources').hide();
            files.hide();
        },
        get: function () {
            if (Utils.check_view_package(view)) {
                var query_data = {};
                query_data.distribution = view.distribution;
                query_data.package = view.package;
                debug_socket('emit', _e.package_files_list, query_data);
                socket.emit(_e.package_files_list, query_data);
                files.get_datestamp();
            }
        },
        get_datestamp: function (socket_data) {
            if (Utils.check_view_package(view)) {
                if (socket_data && socket_data.package != view.package.orig_name)
                    return;
                var url = config.paths.debomatic + '/' +
                    view.distribution.name + '/pool/' +
                    view.package.orig_name + '/' +
                    view.package.orig_name + '.datestamp';
                debug(2, 'getting datestamp');
                $.get(url, function (data) {
                    data = data.replace('Build finished', 'finished');
                    data = data.replace('Elapsed', 'elapsed');
                    data = data.replace(/\n$/g, '');
                    data = data.replace(/\n/g, ' - ');
                    data = data.replace(/at /g, '');
                    $("#file .datestamp").html(data);
                });
            }
        },
        select: function () {
            files.show();
            files.unselect();
            if (Utils.check_view_file(view)) {
                $('#logs li[id="file-' + view.file.orig_name + '"]').addClass('active');
            }
        },
        unselect: function () {
            $('#logs li').removeClass('active');
        },
        hide: function () {
            $('#files').hide();
        },
        show: function () {
            $('#files').show();
        },
    };

    var file = {
        set: function (socket_data) {
            var file_content = $('#file pre');
            view.file = Utils.clone(socket_data.file);
            file_content.text(socket_data.file.content);
            file_content.show();
            if (current_file_in_preview)
                file_content.scrollTop(file_content[0].scrollHeight);
        },
        clean: function () {
            $('#file pre').html('');
            $('#file').hide();
        },
        append: function (new_content) {
            var file_content = $('#file pre');
            if (!current_file_in_preview) {
                file.append(new_content);
            } else {
                // always show only config.file.num_lines lines in preview
                var content = file_content.html().replace(/\n$/, '').split('\n');
                content = content.concat(new_content.replace(/\n$/, '').split('\n'));
                content = content.slice(-config.file.num_lines).join('\n');
                file_content.html(content);
                file_content.scrollTop(file_content[0].scrollHeight);
            }

            if (config.preferences.autoscroll) {
                // scroll down if file is covering footer
                var file_height = $('#fileOffset').offset().top;
                var footerOffset = $('footer').offset().top;
                if (file_height > footerOffset) {
                    debug(2, 'scoll down on new content');
                    $('html,body').animate({
                        scrollTop: file_height
                    }, 0);
                }
            }
        },
        get: function (force) {
            if (Utils.check_view_file(view)) {
                if (force) {
                    file.set_preview(false);
                } else {
                    file.set_preview();
                }
                var query_data = {};
                query_data.distribution = view.distribution;
                query_data.package = view.package;
                query_data.file = view.file;
                query_data.file.content = null;
                query_data.file.force = force;
                // get a feedback to user while downloading file
                $('#file pre').html('Downloading file, please wait a while ...');
                $('#file').show();
                debug_socket('emit', _e.file, query_data);
                socket.emit(_e.file, query_data);
            }
        },
        set_preview: function (preview) {
            if (preview === undefined) {
                preview = config.file.preview.indexOf(view.file.name) >= 0;
            }
            debug(2, "file set preview", preview);
            current_file_in_preview = preview;
            var file = $('#file pre');
            if (preview) {
                $('#file pre').addClass('preview');
                var height = (config.file.num_lines) *
                    parseInt(file.css('line-height').replace(/[^-\d\.]/g, '')) +
                    parseInt(file.css('padding-top').replace(/[^-\d\.]/g, '')) +
                    parseInt(file.css('padding-bottom').replace(/[^-\d\.]/g, ''));
                file.css('max-height', height);
            } else {
                file.removeClass('preview');
                file.css('max-height', 'auto');
            }
        }

    };

    var breadcrumb = {
        update: function (label) {
            if (label) {
                $('.breadcrumb').html('<li class="active">' + label + '</li>');
                return;
            }
            var hash = window.location.hash.replace('#', '');
            var new_html = '';
            var new_hash = '#';
            var info = hash.split('/');
            for (var i = 0; i < info.length; i++) {
                new_hash += info[i];
                if (i == (info.length - 1))
                    new_html += '<li class="active">' + info[i] + '</li>';
                else
                    new_html += '<li><a href="' + new_hash + '">' + info[i] + '</a>';
                new_hash += '/';
            }
            $('.breadcrumb').html(new_html);
        }
    };

    // sticky sidebar
    var sticky = {
        init: function () {
            if (sidebarOffset === 0)
                return;
            if ($(window).scrollTop() > sidebarOffset) {
                sticky.show();
            } else {
                sticky.hide();
                sticky.updateOffset();
            }
        },
        start: function () {
            $(window).scroll(sticky.init);
        },
        stop: function () {
            $(window).off('scroll');
        },
        reset: function () {
            sticky.stop();
            sticky.update();
            sticky.init();
            sticky.start();
        },
        show: function () {
            if (config.preferences.sidebar) {
                $('#sticky').addClass('fixed');
            }
            debug(2, 'showing sticky');
            $('#sticky-package').fadeIn();
        },
        hide: function () {
            $('#sticky').removeClass('fixed');
            $('#sticky-package').fadeOut(150);
        },
        update: function () {
            sticky.updateOffset();
            if (Utils.check_view_distribution(view))
                $('#sticky-package .distribution').html(view.distribution.name);
            if (Utils.check_view_package(view)) {
                $('#sticky-package .name').html(view.package.name);
                $('#sticky-package .version').html(view.package.version);
                sticky.set_status();
            }
        },
        updateOffset: function () {
            var sidebar = $('#files');
            sidebarOffset = sidebar.offset().top;
        },
        set_status: function (status_data) {
            if (!status_data) {
                status_data = {};
                status_data.distribution = view.distribution.name;
                status_data.package = view.package.orig_name;
                status_data.status = view.package.status;
                if (view.package.hasOwnProperty('success'))
                    status_data.success = view.package.success;
            }
            if (Utils.check_view_package(view) && status_data.distribution == view.distribution.name && status_data.package == view.package.orig_name) {
                // update html
                var info = Utils.get_status_icon_and_class(status_data);
                var panel = $('#sticky-package-content');
                panel.removeClass();
                panel.addClass('panel panel-' + info.className);
                var div = $('#sticky-package .status');
                div.find('span.icon').remove();
                div.append(Utils.get_status_icon_html(status_data));
            }
        }
    };

    var error = {
        set: function (socket_error) {
            if ($('#error').is(':visible'))
                return;
            $('#error span').html(socket_error);
            error.view();
        },
        clean: function () {
            $('#error').hide();
            $('#error span').html('');
        },
        view: function () {
            $('#error').fadeIn(100);
            title.set('Something is wrong ...');
            breadcrumb.update('Something is wrong ...');
            file.clean();
            files.hide();
            unselect();
        },
    };

    var welcome = {
        set: function (distributions) {
            welcome.clean();
            if (distributions.length < 1) {
                $('#welcome').append('<p class="lead text-muted">There is no distribution at the moment</p>');
            } else {
                distributions.forEach(function (name) {
                    $('#welcome').append('<a class="btn btn-lg btn-primary" href="' + config.paths.distribution +
                        '#' + name + '">' + name + '</a>');
                });
            }
        },
        show: function () {
            title.set('Please select a distribution');
            breadcrumb.update('Select a distribution');
            packages.hide();
            file.clean();
            files.hide();
            unselect();
            $('#welcome').show();
        },
        clean: function () {
            $('#welcome').html('');
        },
        hide: function () {
            $('#welcome').hide();
        }
    };

    var preferences = function () {
        if (!config.preferences.sidebar) {
            debug(2, 'no sidebar - updating html');
            $('#sidebar').removeClass();
            $('#sidebar').addClass('col-md-12 row');
            $('#packages').addClass('col-md-4');
            $('#logs').addClass('col-md-4');
            $('#files .others').addClass('col-md-4');
            $('#main').removeClass().addClass('col-md-12');
            $('#sticky-package').addClass('on-top');
        }
        if (!config.preferences.file_background) {
            $('#file pre').addClass('no-background');
        }
        $('#file pre').css('font-size', config.preferences.file_fontsize);
    };

    var select = function () {
        unselect();
        if (Utils.check_view_distribution(view)) {
            $('#distributions li[id="distribution-' + view.distribution.name + '"]').addClass('active');
        }
        packages.select();
        files.select();
    };

    var unselect = function () {
        $('#distributions li').removeClass('active');
        files.unselect();
        packages.unselect();
    };

    var clean = function () {
        welcome.hide();
        title.clean();
        packages.clean();
        files.clean();
        file.clean();
        unselect();
        breadcrumb.update();
        error.clean();
    };

    var update = {
        page: function (old_view) {
            if (!old_view || !Utils.check_view_distribution(old_view) || !Utils.check_view_distribution(view) || view.distribution.name != old_view.distribution.name || !view.package.orig_name) { // new distribution view
                populate();
                return;
            } else if (!Utils.check_view_package(old_view) || !Utils.check_view_package(view) ||
                view.package.orig_name != old_view.package.orig_name) { // new package view
                files.get();
                file.get();
            } else if (!Utils.check_view_file(old_view) || !Utils.check_view_file(view) ||
                view.file.name != old_view.file.name) { // new file view
                file.get();
            }
            update.view(view);
        },
        view: function () {
            error.clean();
            title.set();
            breadcrumb.update();
            select();
            sticky.reset();
            // active tooltip
            $("[data-toggle='tooltip']").tooltip();
        }
    };

    var populate = function () {
        clean();
        packages.get();
        files.get();
        file.get();
        update.view();
    };

    this.start = function () {

        socket.on(config.events.error, function (socket_error) {
            debug_socket('received', config.events.error, socket_error);
            error.set(socket_error);
        });

        socket.on(config.events.broadcast.distributions, function (socket_data) {
            debug_socket('received', config.events.broadcast.distributions, socket_data);
            welcome.set(socket_data);
        });

        socket.on(_e.distribution_packages, function (socket_data) {
            debug_socket('received', _e.distribution_packages, socket_data);
            packages.set(socket_data);
        });

        socket.on(_e.distribution_packages_status, function (socket_data) {
            debug_socket('received', _e.distribution_packages_status, socket_data);
            packages.set_status(socket_data);
            sticky.set_status(socket_data);
        });

        socket.on(config.events.broadcast.status_update, function (socket_data) {
            packages.set_status(socket_data);
            sticky.set_status(socket_data);
            files.get_datestamp(socket_data);
        });

        socket.on(_e.package_files_list, function (socket_data) {
            debug_socket('received', _e.package_files_list, socket_data);
            files.set(socket_data);
        });

        socket.on(_e.file, function (socket_data) {
            debug_socket('received', _e.file, socket_data);
            file.set(socket_data);
        });

        socket.on(_e.file_newcontent, function (socket_data) {
            debug_socket('received', _e.file_newcontent, socket_data);
            new_lines.push(socket_data.file.new_content);
        });

        $(window).on('hashchange', function () {
            if (!__check_hash_makes_sense())
                return;
            var old_view = Utils.clone(view);
            var new_view = Utils.from_hash_to_view();
            // reset current view
            view.distribution = Utils.clone(new_view.distribution);
            view.package = Utils.clone(new_view.package);
            if (view.packages[new_view.package.orig_name])
                view.package = Utils.clone(view.packages[new_view.package.orig_name]);
            view.file = Utils.clone(new_view.file);
            update.page(old_view);
            $('html,body').animate({
                scrollTop: 0
            }, 0);
            debug(1, 'changing view', 'old:', old_view, 'new:', view);
        });

        if (!__check_hash_makes_sense())
            return;
        populate();

        // Init sticky-package back_on_top on click
        $('#sticky-package').on('click', function () {
            $('html,body').animate({
                scrollTop: 0
            }, 100);
        });

        // WORKAROUND:
        // when page is loaded sidebar has offset().top
        // equals 0. This is because html is loaded on socket
        // events. Sleep a while and call stiky.reset()
        setTimeout(sticky.reset, 500);

        // WORKAROUND:
        // On incoming hundred of lines browser goes crazy.
        // Append lines every 200 mills.
        function watch_for_new_lines() {
            if (new_lines.length > 0) {
                file.append(new_lines.join(''));
                new_lines = [];
            }
            setTimeout(watch_for_new_lines, 150);
        }
        watch_for_new_lines();

        // Handle search packages
        $('#packages .search').on('keyup', function (event) {
            packages.search($(event.target).val());
        });

        // Update html according with preferences
        preferences();

    };
}
