var socket = io.connect('//localhost:3000');

// update distributions
socket.on('distributions', function(distributions) {
    $('#distributions ul').html('');
    distributions.forEach(function (name){
      $('#distributions ul').append('<li id="distribution-' + name +'"><a href="'+ DISTRIBUTION_PAGE + '#'+ name + '">' + name + '</li>');
    });
});

if (window.location.pathname == DISTRIBUTION_PAGE) {

  function __check_hash_has_sense() {
    info = window.location.hash.split('/')
    if (info.length == 2)
      window.location.hash = info[0]
  }

  var old_data = Utils.from_hash_to_data()

  socket.on('distribution_packages', function(data){
    Page_Distrubion.packages.set(data)
  })

  socket.on('package_files_list', function(data){
    Page_Distrubion.files.set(data)
  })

  socket.on('file', function (data) {
    Page_Distrubion.file.set(data)
  })

  socket.on('file_newcontent', function(data) {
    Page_Distrubion.file.append(data)
  })

  $(window).on('hashchange', function() {
    __check_hash_has_sense()
    data = Utils.from_hash_to_data()
    Page_Distrubion.update(data, old_data)
    old_data = data
  });

  $(window).on('load', function (){
    __check_hash_has_sense()
    Page_Distrubion.update(old_data)
  });
}

socket.on('error', function() { console.error(arguments) });
