function Page_Distrubion()
{
  var socket
  var data = Utils.from_hash_to_data()

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
        $('#packages ul').append('<li id="package-' + p.orig_name + '"><a href="' + Utils.from_data_to_hash(tmp) + '">'+ p.name + ' <span>'+p.version+'</span></a></li>')
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
        socket.emit("get_distribution_packages", new_data)
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
          $('#debs ul').append('<li><a title="'+ f.orig_name +'" href="' + f.path + '">' + f.name  +'</a> <span>.' + f.label + '</span></li>')
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
        socket.emit("get_package_files_list", new_data)
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
    append: function(data) {
      var new_html =  $("#file pre").html() + data.file.new_content
      $("#file pre").html(new_html)
      
      if (config.autoscroll) // scroll down
        $('body,html').animate({ scrollTop: $('#file pre').height() }, 500);
    },
    get: function() {
      if (Utils.check_data_file(data)) {
        var new_data = {}
        new_data.distribution = data.distribution
        new_data.package = data.package
        new_data.file = data.file
        new_data.file.content = null
        socket.emit("get_file", new_data)
      }
    }
  }

  var breadcrumb = {
    update: function(hash) {
      if (! hash )
        hash = window.location.hash
      hash = hash.replace('#', '')
      var new_html = '<li><a href="/">home</a></li>'
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

  // stiky sidebar
  var sticky = function() {
//    $(window).off("scroll")
//    // back on top
////    $("html, body").animate({scrollTop: 0}, 0);
//    var offset = $("#sticky").offset();
//    $(window).scroll(function() {
//      if ($(window).scrollTop() > offset.top)
//        $("#sticky").stop().addClass('fixed');
//      else 
//        $("#sticky").stop().removeClass('fixed');
//    })
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
        file.clean()
        files.get()
        if ( Utils.check_data_package(data)
          && window.location.hash.split('/').length <= 3)
        {
          // I will always get datastamp file from package
          window.location.hash += '/datestamp'
        }
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
      sticky()
    }
  }

  var populate = function () {
    clean()
    packages.get()
    files.get()
    file.get()
    update.view()
  }

  this.init = function (mysocket) {

    socket = mysocket

    socket.on('distribution_packages', function(socket_data){
      packages.set(socket_data)
    })

    socket.on('package_files_list', function(socket_data){
      files.set(socket_data)
    })

    socket.on('file', function (socket_data) {
      file.set(socket_data)
    })

    socket.on('file_newcontent', function(socket_data) {
      file.append(socket_data)
    })

    $(window).on('hashchange', function() {
      __check_hash_makes_sense()
      var old_data = data
      data = Utils.from_hash_to_data()
      update.page(old_data)
    });

    $(window).on('load', function (){
      __check_hash_makes_sense()
      populate()
    });
  }

}
