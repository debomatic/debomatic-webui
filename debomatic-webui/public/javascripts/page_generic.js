function Page_Generic()
{
  var socket;
  var c = config.status.classes
  var i = config.status.icons
  var e = config.events

  function __get_status_html(status_package) {
    var s = status_package
    var li = $('<li></li>')
    li.attr('id', 'status-' + s.distribution + "-" + s.package)
    var button = $('<a></a>')
    button.addClass('btn btn-xs')
    button.addClass(s.status)
    button.attr('title', s.status + ': ' + s.distribution + ' > ' + s.package)
    button.attr('href', config.paths.distribution + '#' + s.distribution + '/' + s.package.replace('_', '/') + '/datestamp')
//    button.html(s.package)
    button.html(s.package.split('_')[0])
    var button_class = null
    var icon = null
    if (s.status == 'building') {
      button_class = c.building
      icon = i.building
    }
    else if (s.status == 'build-failed') {
      button_class = c.failed
      icon = i.failed
    }
    else {
      button_class = c.successed
      icon = i.successed
    }
    button.addClass('btn-' + button_class)
    button.html(button.html() + ' <span class="icon glyphicon glyphicon-' + icon + '"></span>')
    li.html(button)
    var result = $('<div></div>')
    result.html(li)
    return result.html()
  }

  var update = {
    distributions: function(distributions) {
      $('#distributions ul').html('');
      distributions.forEach(function (name){
        $('#distributions ul').append('<li id="distribution-' + name +'"><a href="'+ config.paths.distribution + '#'+ name + '">' + name + '</li>');
      });
      if (window.location.pathname == config.paths.distribution) {
        data = Utils.from_hash_to_data()
        if (Utils.check_data_distribution(data)) {
          $("#distributions li[id='distribution-"  + data.distribution.name + "']").addClass('active')
        }
      }
    },
    status: function(new_package) {
      
    }
  }

  var status =  {
    set: function(data_status) {
      $("#status ul").html('')
      if (data_status.packages.length > 0) {
        $('#status .idle').hide()
        data_status.packages.forEach(function(p){
          $("#status ul").html($("#status ul").html()  + " " + __get_status_html(p))
      })

      }
    }
  }

  this.init = function(mysocket) {

    socket = mysocket

    // update distributions
    socket.on(e.broadcast.distributions, function(distributions) {
      update.distributions(distributions)
    });

    socket.on('error', function(data) { console.error(data) });

    socket.on(e.client.status, function(data_status) {
      status.set(data_status)
    })

    socket.on(e.broadcast.status_update, function(data) {
      // this is how to fadeout and remove
      // setTimeout(function() {$('#id-status').remove();}, 3500);
      // $($("li[id='id-status']")[0]).delay(3200).fadeOut(300)
      console.log('status_update')
      console.log(data)
    })
  }
}
