// update distributions
socket.on('distributions', function(distributions) {
    $('#distributions ul').html('');
    distributions.forEach(function (name){
      $('#distributions ul').append('<li id="distribution-' + name +'"><a href="'+ PATHS.distribution + '#'+ name + '">' + name + '</li>');
    });
});

socket.on('error', function(data) { console.error(data) });

socket.on('status', function(data) {
  console.log('status')
  console.log(data)
})

socket.on('status-update', function(data) {
  console.log('status')
  console.log(data)
})

if (window.location.pathname == PATHS.distribution) {
  new Page_Distrubion().init(socket)
}
