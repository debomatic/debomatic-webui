function Page_Distrubion(socket)
{

    /*

      General Objects description:

      The current view:

      view = {}
      view.distribution                       --- the selected distribution
      view.distribution.name
      view.distribution
      view.packages = {package}
      view.package                            --- the selected package
      view.package.name
      view.package.version
      view.package.orig_name
      view.package.status
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

    */

  var socket = socket
  var _e = config.events.client
  var view = Utils.from_hash_to_view()
  var sidebarOffset = 0
  var new_lines = []

  function __check_hash_makes_sense() {
    if (window.location.hash.indexOf('..') >= 0) {
      error.set('God Is Watching You !')
      return false
    }
    if (! window.location.hash)
      window.location.pathname = '/'
    var info = window.location.hash.split('/')
    if (info.length == 2)
      window.location.hash = info[0]
    return true
  }

  var title = {
    set: function() {
      var label = ''
      if (Utils.check_view_file(view)) {
        var complete_name = view.package.orig_name + '.' + view.file.name
        if (! view.file.path)
          view.file.path = config.paths.debomatic + '/' + view.distribution.name + '/pool/' + view.package.orig_name + '/' + complete_name
        label = complete_name + ' \
          <a class="btn btn-link btn-lg" title="Download" href="' + view.file.path + '">\
            <span class="glyphicon glyphicon-download-alt"></span>\
          </a>'
      }
      else if (Utils.check_view_package(view))
        label = view.package.orig_name
      else if (Utils.check_view_distribution(view))
        label = view.distribution.name
      $('#title').html(label)
    },
    clean: function() {
      $('#title').html('')
    }
  }

  var packages = {
    set: function (socket_data) {
      $('#packages ul').html('')
      var tmp = Utils.clone(socket_data)
      tmp.file = null
      view.packages = {}
      socket_data.distribution.packages.forEach(function(p){
        tmp.package = p
        // get datestamp if package is clicked
        $('#packages ul').append('<li id="package-' + p.orig_name + '"><a href="' + Utils.from_view_to_hash(tmp) + '/datestamp">'+ p.name + ' <span>'+p.version+'</span></a></li>')
        view.packages[p.orig_name] = Utils.clone(p)
      })
      packages.select()
    },
    
    clean: function () {
      $('#packages ul').html('')
    },
    get: function () {
      if (Utils.check_view_distribution(view)) {
        var query_data = {}
        query_data.distribution = view.distribution
        socket.emit(_e.distribution_packages.get, query_data)
      }
    },
    select: function() {
      packages.unselect()
      if (Utils.check_view_package(view)) {
        $("#packages li[id='package-"+ view.package.orig_name + "']").addClass('active')
      }
    },
    unselect: function() {
      $('#packages li').removeClass('active')
    },
    set_status: function (status_data) {
      // set status in view
      if ( view.distribution.name == status_data.distribution
        && view.packages[status_data.package] )
      {
        view.packages[status_data.package].status = Utils.clone(status_data.status)
      }
      // and in html
      var p_html = $("#packages li[id='package-"+ status_data.package + "'] a")
      p_html.find('span.icon').remove()
      p_html.html(p_html.html() + ' ' + Utils.get_status_icon_html(status_data))
      if (Utils.check_view_package(view)
        && view.package.orig_name == status_data.package
        && view.distribution.name == status_data.distribution)
      {
        // in case user is watching this package, update also view.package
        view.package.status = Utils.clone(status_data.status)
      }
    }
  }

  var files = {
    set: function (socket_data) {
      files.clean()
      var tmp = Utils.clone(socket_data)
      if (socket_data.package.files && socket_data.package.files.length > 0) {
        // update view
        view.package.files = Utils.clone(socket_data.package.files)
        // update html
        socket_data.package.files.forEach(function(f){
          tmp.file = f
          var html_file = $('<li id="file-'+ f.orig_name +'"><a title="'+ f.orig_name +'" href="'+ Utils.from_view_to_hash(tmp) + '">' + f.name + '</a></li>')
          html_file.on("click", function(){
            files.select(this)
          })
          $('#logs ul').append(html_file)
        })
        $('#logs').show()
        files.select()
      }
      
      if (socket_data.package.debs && socket_data.package.debs.length > 0) {
        // update view
        view.package.debs = Utils.clone(socket_data.package.debs)
        // update.html
        socket_data.package.debs.forEach(function(f){
          $('#debs ul').append('<li><a title="'+ f.orig_name +'" href="' + f.path + '">' + f.name  +'</a> <span>.' + f.extension + '</span></li>')
        })
        $('#debs').show()
      }
      
      if (socket_data.package.sources && socket_data.package.sources.length > 0) {
        // update view
        view.package.sources = Utils.clone(socket_data.package.sources)
        // update html
        socket_data.package.sources.forEach(function(f){
          $('#sources ul').append('<li><a title="'+ f.orig_name +'" href="' + f.path + '">' + f.name  +'</a></li>')
        })
        $('#sources').show()
      }
      $('#files').show()
    },
    clean: function() {
      $('#logs ul').html('');
      $('#logs').hide()
      $('#debs ul').html('');
      $('#debs').hide();
      $('#sources ul').html('')
      $('#sources').hide()
      $('#files').hide()
    },
    get: function () {
      if (Utils.check_view_package(view)) {
        var query_data = {}
        query_data.distribution = view.distribution
        query_data.package = view.package
        socket.emit(_e.package_files_list.get, query_data)
      }
    },
    select: function() {
      files.unselect()
      if (Utils.check_view_file(view)) {
        $("#logs li[id='file-" + view.file.orig_name + "']").addClass('active')
      }
    },
    unselect: function() {
        $('#logs li').removeClass('active');
    }
  }

  var file = {
    set: function(socket_data) {
      view.file = Utils.clone(socket_data.file)
      $("#file pre").html(socket_data.file.content)
      $("#file").show()
    },
    clean: function() {
      $('#file pre').html('')
      $('#file').hide()
    },
    append: function(new_content) {
      var content = $("#file pre")
      content.html(content.html() + new_content)
      
      if (config.autoscroll) {
        // scroll down if file is covering footer
        var file_height = $("#fileOffset").offset().top
        var footerOffset = $("footer").offset().top
        if (file_height > footerOffset) {
          $('html').animate({ scrollTop: file_height }, 0);
        }
      }
    },
    get: function() {
      if (Utils.check_view_file(view)) {
        var query_data = {}
        query_data.distribution = view.distribution
        query_data.package = view.package
        query_data.file = view.file
        query_data.file.content = null
        socket.emit(_e.file.get, query_data)
      }
    }
  }

  var breadcrumb = {
    update: function(hash) {
      if (! hash )
        hash = window.location.hash
      hash = hash.replace('#', '')
      var new_html = ''
      var new_hash = '#'
      var info = hash.split('/')
      for (var i = 0; i < info.length ; i++) {
        new_hash += info[i]
        if (i == (info.length - 1))
          new_html += '<li class="active">' + info[i] + '</li>'
        else
          new_html += '<li><a href="' + new_hash + '">' + info[i] + '</a>'
        new_hash += '/'
      }
      $('.breadcrumb').html(new_html)
    }
  }

  // sticky sidebar
  var sticky = {
    init: function() {
      if (sidebarOffset == 0)
          return
      if ($(window).scrollTop() > sidebarOffset) {
        sticky.show()
      } else {
        sticky.hide()
      }
    },
    start: function() {
      $(window).scroll(sticky.init)
    },
    reset: function() {
      sticky.stop()
      sticky.update()
      sticky.init()
      sticky.start()
    },
    stop: function() {
      $(window).off("scroll")
    },
    show: function() {
      $("#sticky").addClass('fixed')
      $("#sticky-view").fadeIn()
    },
    hide: function() {
      $("#sticky").removeClass('fixed')
      $("#sticky-view").fadeOut(150)
    },
    update: function() {
      var sidebar = $("#files")
      sidebarOffset = sidebar.offset().top
      if (Utils.check_view_distribution(view))
        $("#sticky-view .distribution").html(view.distribution.name)
      if (Utils.check_view_package(view)) {
        $("#sticky-view .name").html(view.package.name)
        $("#sticky-view .version").html(view.package.version)
        sticky.set_status()
      }
    },
    set_status: function(status_data) {
      if (! status_data) {
        status_data = {}
        status_data.distribution = view.distribution.name
        status_data.package = view.package.orig_name
        status_data.status = view.package.status
      }
      if ( Utils.check_view_package(view)
        && status_data.distribution == view.distribution.name
        && status_data.package == view.package.orig_name)
      {
        // update html
        var info = Utils.get_status_icon_and_class(status_data)
        var panel = $("#sticky-view")
        panel.removeClass()
        panel.addClass('panel panel-' + info.className)
        var div = $("#sticky-view .status")
        div.find('span.icon').remove()
        div.html(div.html() + ' ' + Utils.get_status_icon_html(status_data))
      }
    }
  }

  var error = {
    set: function(socket_error) {
      $("#error span").html(socket_error)
      $("#error").fadeIn(100)
    },
    clean: function() {
      $("#error").hide()
      $("#error span").html('')
    },
  }
  
  var select = function() {
      unselect()
      if (Utils.check_view_distribution(view)) {
        $("#distributions li[id='distribution-"  + view.distribution.name + "']").addClass('active')
      }
      packages.select()
      files.select()
  }

  var unselect = function() {
    $('#distributions li').removeClass('active')
    files.unselect()
    packages.unselect()
  }

  var clean = function() {
    title.clean()
    packages.clean()
    files.clean()
    file.clean()
    unselect()
    breadcrumb.update()
  }

  var update = {
    page: function(old_view) {
      if ( ! old_view
        || ! Utils.check_view_distribution(old_view)
        || ! Utils.check_view_distribution(view)
        || view.distribution.name != old_view.distribution.name 
        )
      { // new distribution view
        populate()
        return
      }
      else if ( ! Utils.check_view_package(old_view)
        || ! Utils.check_view_package(view)
        || view.package.orig_name != old_view.package.orig_name
      )
      { // new package view
        // set status from packages
        if (view.packages[view.package.orig_name])
          view.package.status = view.packages[view.package.orig_name].status
        files.get()
        file.clean()
        file.get()
      }
      else if ( ! Utils.check_view_file(old_view)
        || ! Utils.check_view_file(view)
        || view.file.name != old_view.file.name
      )
      { // new file view
        file.get()
      }
      error.clean()
      update.view(view)
    },
    view : function() {
      title.set()
      breadcrumb.update()
      select()
      sticky.reset()
    }
  }

  var populate = function () {
    clean()
    packages.get()
    files.get()
    file.get()
    update.view()
  }

  this.start = function () {

    socket.on(config.events.error, function(socket_error) {
      error.set(socket_error)
    })

    socket.on(_e.distribution_packages.set, function (socket_data){
      packages.set(socket_data)
    })

    socket.on(_e.distribution_packages.status, function (socket_data){
      packages.set_status(socket_data)
      sticky.set_status(socket_data)
    })

    socket.on(config.events.broadcast.status_update, function (socket_data){
      packages.set_status(socket_data)
      sticky.set_status(socket_data)
    })

    socket.on(_e.package_files_list.set, function (socket_data){
      files.set(socket_data)
    })

    socket.on(_e.file.set, function (socket_data) {
      file.set(socket_data)
    })

    socket.on(_e.file_newcontent, function (socket_data) {
      new_lines.push(socket_data.file.new_content)
    })

    $(window).on('hashchange', function() {
      if (! __check_hash_makes_sense())
        return
      var old_view = Utils.clone(view)
      var new_view = Utils.from_hash_to_view()
      // reset current view
      view.distribution = Utils.clone(new_view.distribution)
      view.package = Utils.clone(new_view.package)
      if (view.packages[view.package.orig_name])
        view.package.status = view.packages[view.package.orig_name].status
      view.file = Utils.clone(new_view.file)
      update.page(old_view)
      $('html').animate({scrollTop: 0}, 0);
    });

    $(window).on('load', function () {
      if (! __check_hash_makes_sense())
        return
      populate()

      // Init sticky-view back_on_top on click
      $("#sticky-view").on("click", function(){
        $('html').animate({scrollTop: 0}, 100);
      })

      // WORKAROUND:
      // when page is loaded sidebar has offset().top
      // equals 0. This is because html is loaded on socket
      // events. Sleep a while and call stiky.reset()
      this.setTimeout(sticky.reset, 500);

      // WORKAROUND:
      // On incoming hundred of lines browser goes crazy.
      // Append lines every 200 mills.
      function watch_for_new_lines() {
        if (new_lines.length > 0) {
          file.append(new_lines.join(''))
          new_lines = []
        }
        setTimeout(watch_for_new_lines, 200);
      }
      watch_for_new_lines()
    });
  }

}
