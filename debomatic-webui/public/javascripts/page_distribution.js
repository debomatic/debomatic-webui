function Page_Distrubion(socket)
{
  var socket = socket
  var events = config.events.client
  var data = Utils.from_hash_to_data()
  var sidebarOffset = 0
  var new_lines = []

  function __check_hash_makes_sense() {
    if (! window.location.hash)
      window.location.pathname = '/'
    var info = window.location.hash.split('/')
    if (info.length == 2)
      window.location.hash = info[0]
  }

  var title = {
    set: function() {
      var label = ''
      if (Utils.check_data_file(data)) {
        var complete_name = data.package.orig_name + '.' + data.file.name
        if (! data.file.path)
          data.file.path = config.paths.debomatic + '/' + data.distribution.name + '/pool/' + data.package.orig_name + '/' + complete_name
        label = complete_name + ' \
          <a class="btn btn-link btn-lg" title="Download" href="' + data.file.path + '">\
            <span class="glyphicon glyphicon-download-alt"></span>\
          </a>'
      }
      else if (Utils.check_data_package(data))
        label = data.package.orig_name
      else if (Utils.check_data_distribution(data))
        label = data.distribution.name
      $('#title').html(label)
    },
    clean: function() {
      $('#title').html('')
    }
  }

  var packages = {
    set: function (socket_data) {
      $('#packages ul').html('')
      var tmp = socket_data
      tmp.file = null
      socket_data.distribution.packages.forEach(function(p){
        tmp.package = p
        // get datestamp if package is clicked
        $('#packages ul').append('<li id="package-' + p.orig_name + '"><a href="' + Utils.from_data_to_hash(tmp) + '/datestamp">'+ p.name + ' <span>'+p.version+'</span></a></li>')
        data.packages
      })
      packages.select()
    },
    
    clean: function () {
      $('#packages ul').html('')
    },
    get: function () {
      if (Utils.check_data_distribution(data)) {
        var new_data = {}
        new_data.distribution = data.distribution
        socket.emit(events.distribution_packages.get, new_data)
      }
    },
    select: function() {
      packages.unselect()
      if (Utils.check_data_package(data)) {
        $("#packages li[id='package-"+ data.package.orig_name + "']").addClass('active')
      }
    },
    unselect: function() {
      $('#packages li').removeClass('active')
    },
    set_status: function (status_data) {
      var p_html = $("#packages li[id='package-"+ status_data.package + "'] a")
      p_html.find('span.icon').remove()
      p_html.html(p_html.html() + ' ' + Utils.get_status_icon_html(status_data))
      if (Utils.check_data_package(data)
        && data.package.orig_name == status_data.package
        && data.distribution.name == status_data.distribution)
      {
        console.log(status_data)
        data.package.status = status_data.status
      }
    }
  }

  var files = {
    set: function (socket_data) {
      files.clean()
      var tmp = socket_data
      if (socket_data.package.files && socket_data.package.files.length > 0) {
        selected_file = Utils.check_data_file(socket_data)
        socket_data.package.files.forEach(function(f){
          tmp.file = f
          var html_file = $('<li id="file-'+ f.orig_name +'"><a title="'+ f.orig_name +'" href="'+ Utils.from_data_to_hash(tmp) + '">' + f.name + '</a></li>')
          html_file.on("click", function(){
            files.select(this)
          })
          $('#logs ul').append(html_file)
        })
        $('#logs').show()
        files.select()
      }
      
      if (socket_data.package.debs && socket_data.package.debs.length > 0) {
        socket_data.package.debs.forEach(function(f){
          $('#debs ul').append('<li><a title="'+ f.orig_name +'" href="' + f.path + '">' + f.name  +'</a> <span>.' + f.extension + '</span></li>')
        })
        $('#debs').show()
      }
      
      if (socket_data.package.sources && socket_data.package.sources.length > 0) {
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
      if (Utils.check_data_package(data)) {
        var new_data = {}
        new_data.distribution = data.distribution
        new_data.package = data.package
        socket.emit(events.package_files_list.get, new_data)
      }
    },
    select: function() {
      files.unselect()
      if (Utils.check_data_file(data)) {
        $("#logs li[id='file-" + data.file.orig_name + "']").addClass('active')
      }
    },
    unselect: function() {
        $('#logs li').removeClass('active');
    }
  }

  var file = {
    set: function(socket_data) {
      $("#file pre").html(socket_data.file.content)
      $("#file").show()
      select()
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
      if (Utils.check_data_file(data)) {
        var new_data = {}
        new_data.distribution = data.distribution
        new_data.package = data.package
        new_data.file = data.file
        new_data.file.content = null
        socket.emit(events.file.get, new_data)
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
      if (Utils.check_data_distribution(data))
        $("#sticky-view .distribution").html(data.distribution.name)
      if (Utils.check_data_package(data)) {
        $("#sticky-view .name").html(data.package.name)
        $("#sticky-view .version").html(data.package.version)
        var status_data = {}
        status_data.distribution = data.distribution.name
        status_data.package = data.package.orig_name
        status_data.status = data.package.status
        sticky.set_status(status_data)
      }
    },
    set_status: function(status_data) {
      if ( Utils.check_data_package(data)
        && status_data.distribution == data.distribution.name
        && status_data.package == data.package.orig_name)
      {
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
  
  var select = function() {
      unselect()
      if (Utils.check_data_distribution(data)) {
        $("#distributions li[id='distribution-"  + data.distribution.name + "']").addClass('active')
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
    page: function(old_data) {
      if ( ! old_data
        || ! Utils.check_data_distribution(old_data)
        || ! Utils.check_data_distribution(data)
        || data.distribution.name != old_data.distribution.name 
        )
      { // new distribution view
        populate()
        return
      }
      else if ( ! Utils.check_data_package(old_data)
        || ! Utils.check_data_package(data)
        || data.package.orig_name != old_data.package.orig_name
      )
      { // new pacakge view
        files.get()
        // I will always get datestamp file from package view
        file.clean()
        file.get()
      }
      else if ( ! Utils.check_data_file(old_data)
        || ! Utils.check_data_file(data)
        || data.file.name != old_data.file.name
      )
      { // new file view
        file.get()
      }
      update.view(data)
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

    socket.on(events.distribution_packages.set, function (socket_data){
      packages.set(socket_data)
    })

    socket.on(events.distribution_packages.status, function (socket_data){
      packages.set_status(socket_data)
      // FIX_ME - qui ricevo tutti gli stati mentre sto sempre sulla stessa view!!
      // refactory rename data -> view
      //    view.packages = {} -> key = package.orig_name
      //    view.file 
      //    ......
      // creare una socket_data quando voglio inviare
      sticky.set_status(socket_data)
    })

    socket.on(config.events.broadcast.status_update, function (socket_data){
      packages.set_status(socket_data)
      sticky.set_status(socket_data)
    })

    socket.on(events.package_files_list.set, function (socket_data){
      files.set(socket_data)
    })

    socket.on(events.file.set, function (socket_data) {
      file.set(socket_data)
    })

    socket.on(events.file_newcontent, function (socket_data) {
      new_lines.push(socket_data.file.new_content)
    })

    $(window).on('hashchange', function() {
      __check_hash_makes_sense()
      var old_data = data
      data = Utils.from_hash_to_data()
      update.page(old_data)
      $('html').animate({scrollTop: 0}, 0);
    });

    $(window).on('load', function () {
      __check_hash_makes_sense()
      populate()

      // Init sticky-view back top on click
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
