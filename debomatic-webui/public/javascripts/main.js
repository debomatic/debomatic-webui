var socket = io.connect('//localhost:3000');

// update distributions
socket.on('distributions', function(distributions) {
    $('#distributions ul').html('');
    distributions.forEach(function (name){
      $('#distributions ul').append('<li id="distribution-' + name +'"><a href="/distribution#' + name + '">' + name + '</li>');
    });
});

if (window.location.pathname == '/distribution') {

  var old_data = Utils.from_hash_to_data()

  socket.on('distribution_packages', function(data){
    Page_Distrubion.packages.set(data)
  })

  socket.on('package_file_list', function(data){
    Page_Distrubion.files.set(data)
  })

  socket.on('file', function (data) {
    Page_Distrubion.file.set(data)
  })

  socket.on('file_newcontent', function(data) {
    Page_Distrubion.file.append(data)
  })

  $(window).on('hashchange', function() {
    data = Utils.from_hash_to_data()
    Page_Distrubion.update(data, old_data)
    old_data = data
  });

  $(window).on('load', function (){
    Page_Distrubion.update(old_data)
    $(window).scroll(function() {
      var offset = $("#file").offset();
      if ($(window).scrollTop() > offset.top + 220) {
        $("#sticky").stop().addClass('fixed');
      } 
      else {
        $("#sticky").stop().removeClass('fixed');
      }
    });
  });
}

socket.on('error', function() { console.error(arguments) });
