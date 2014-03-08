var socket = io.connect('//localhost:3000');


if (window.location.pathname == '/') {

  var old_data = Utils.from_hash_to_data()

  socket.on('distributions', function(distributions) {
    Page_Distrubion.navbar.update(distributions)
  });

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
