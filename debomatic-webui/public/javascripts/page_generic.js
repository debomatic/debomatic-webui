function Page_Generic()
{
  var socket;

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
    }
  }

  this.init = function(mysocket) {

    socket = mysocket

    // update distributions
    socket.on(config.events.broadcast.distributions, function(distributions) {
      update.distributions(distributions)
    });

    socket.on('error', function(data) { console.error(data) });

    socket.on('status', function(data) {
      console.log('status')
      console.log(data)
    })

    socket.on(config.events.broadcast.status_update, function(data) {
      console.log('status_update')
      console.log(data)
    })
  }
}
