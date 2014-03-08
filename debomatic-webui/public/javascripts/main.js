function get_path(path) {
  info = path.split('/');
  data = {}
  if (info.length >= 1) {
    data.distribution = {}
    data.distribution.name = info[0];
    socket.emit("get_distribution_packages", data)
    select_navbar_voice(data)
  }
  if (info.length >= 3){
    data.package = {}
    data.package.name = info[1];
    data.package.version = info[2];
    socket.emit("get_package_file_list", data)
  }
  if (info.length >= 4) {
    data.file = {}
    data.file.name = info[3]
    socket.emit("get_file", data)
  }
  update_breadcrumb(path)
}

function select_navbar_voice(data) {

}

function update_breadcrumb(hash) {

}

var socket = io.connect('//localhost:3000');
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

socket.on('error', function() { console.error(arguments) });

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
