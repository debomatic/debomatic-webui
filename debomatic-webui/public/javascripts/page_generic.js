function Page_Generic()
{
  var socket;

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

  var update = {
    distributions: function(distributions) {
      $('#distributions ul').html('');
      if(distributions.length < 1) {
        $('#distributions ul').append('<li><a title="There is no distribution at the moment" onclick="return false">None</li>')
      }
      else {
        distributions.forEach(function (name){
          $('#distributions ul').append('<li id="distribution-' + name +'"><a href="'+ config.paths.distribution + '#'+ name + '">' + name + '</li>');
        });
        if (window.location.pathname == config.paths.distribution) {
          data = Utils.from_hash_to_data()
          if (Utils.check_data_distribution(data)) {
            $("#distributions li[id='distribution-"  + data.distribution.name + "']").addClass('active')
          }
        }
      }
    },

    status: function(status_package) {

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
    }
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
      $("#status ul").html($("#status ul").html()  + " " + __get_status_html(status_package))
    }
  }

  this.init = function(mysocket) {

    var _e = config.events
    socket = mysocket

    // update distributions
    socket.on(_e.broadcast.distributions, function(distributions) {
      update.distributions(distributions)
    });

    socket.on('error', function(data) { consol_e.error(data) });

    socket.on(_e.client.status, function(packages) {
      status.set(packages)
    })

    socket.on(_e.broadcast.status_update, function(package_status) {
      update.status(package_status)
    })
  }
}
