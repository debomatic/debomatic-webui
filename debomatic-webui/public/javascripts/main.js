// update distributions
socket.on(config.events.broadcast.distributions, function(distributions) {
    $('#distributions ul').html('');
    distributions.forEach(function (name){
      $('#distributions ul').append('<li id="distribution-' + name +'"><a href="'+ config.paths.distribution + '#'+ name + '">' + name + '</li>');
    });
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

if (window.location.pathname == config.paths.distribution) {
  new Page_Distrubion().init(socket)
}
