function Page_Generic(socket)
{
  var _e = config.events

  function __get_status_html(status_package) {
    var s = status_package
    var li = $('<li></li>')
    li.attr('id', 'status-' + s.distribution + "-" + s.package)
    var button = $('<a></a>')
    button.addClass('btn btn-xs')
    button.addClass(s.status)
    button.attr('title', s.status + ': ' + s.distribution + ' > ' + s.package)
    button.attr('href', config.paths.distribution + '#' + s.distribution + '/' + s.package.replace('_', '/') + '/datestamp')
    button.html(s.package.split('_')[0])
    var info = Utils.get_status_icon_and_class(s)
    button.addClass('btn-' + info.className)
    // add icon
    button.html(button.html() + ' ' + Utils.get_status_icon_html(s))
    li.html(button)
    var result = $('<div></div>')
    result.html(li)
    return result.html()
  }

  var distributions = {
    set: function(distributions) {
      $('#distributions ul').html('');
      if(distributions.length < 1) {
        $('#distributions ul').append('<li><a title="There is no distribution at the moment" onclick="return false">None</li>')
      }
      else {
        distributions.forEach(function (name){
          $('#distributions ul').append('<li id="distribution-' + name +'"><a href="'+ config.paths.distribution + '#'+ name + '">' + name + '</a></li>');
        });
        if (window.location.pathname == config.paths.distribution) {
          var data = Utils.from_hash_to_view()
          if (Utils.check_view_distribution(data)) {
            $("#distributions li[id='distribution-"  + data.distribution.name + "']").addClass('active')
          }
        }
      }
    },
  }

  var status =  {
    set: function(data_status) {
      $("#status ul").html('')
      if (data_status.packages.length > 0) {
        data_status.packages.forEach(function(p){
          status.append(p)
        })
      }
    },
    append: function(status_package) {
      $('#status .idle').hide()
      $("#status ul").append(__get_status_html(status_package))
    },
    update: function(status_package) {

      var li = $("#status li[id='status-" + status_package.distribution + "-" + status_package.package + "']")
      if (li.length > 0
        && status_package.status != config.status.package.building)
      {
        // Update color and icon
        li.html($(__get_status_html(status_package)).children())
        li.attr('id', '')
        // This is a chain to have a fadeOut and correctly
        // delete package from list.
        // The first timemout fades out the package.
        setTimeout(function() {
          li.children().fadeOut(config.status.delay.fadeOut)
          // Then resize packages list.
          setTimeout(function() {
            li.animate({width: 'toggle'})
            }, config.status.delay.fadeOut)
            // Finally remove package html
            // and show idle status if necessary.
            setTimeout(function() {
              li.remove()
              if ($('#status li').length == 0)
                $('#status .idle').show()
            }, config.status.delay.remove + 2000) // more delay on remove html
          }, config.status.delay.remove)
      }
      else if (status_package.status == config.status.package.building) {
        status.append(status_package)
      }
    },
  }

  this.preferences = function() {
    if (config.preferences.header) {
      $("#pageheader").show()
      $(".navbar .home-link").hide()
    }
    else {
      $("#pageheader").hide()
      $(".navbar .home-link").show()
    }

    if (config.preferences.glossy_theme) {
      $("head").append('<link rel="stylesheet" href="/external_libs/bootstrap-3.1.1-dist/css/bootstrap-theme.min.css">')
    }
    else {
      $("head").find("link[href='/external_libs/bootstrap-3.1.1-dist/css/bootstrap-theme.min.css']").remove()
    }
  }

  // update distributions
  socket.on(_e.broadcast.distributions, function(socket_distributions) {
    debug_socket("received", _e.broadcast.distributions, socket_distributions)
    distributions.set(socket_distributions)
  });

  socket.on(_e.client.status, function(packages_status) {
    debug_socket("received", _e.client.status, packages_status)
    status.set(packages_status)
  })

  socket.on(_e.broadcast.status_update, function(package_status) {
    debug_socket("received", _e.broadcast.status_update, package_status)
    status.update(package_status)
  })

  socket.on(_e.error, function(error) {
    console.error("socket > " + error)
  })

  // select current page in navbar
  if (window.location.pathname != config.paths.distribution) {
    $(".navbar li a[href='" + window.location.pathname + "']").parent().addClass("active")
  }

  // update html according with preferences
  this.preferences()

}
