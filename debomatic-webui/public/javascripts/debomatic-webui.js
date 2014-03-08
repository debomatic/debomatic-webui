function get_path(path) {
  info = path.split('/');
  data = {}
  if (info.length >= 1) {
    data.distribution = {}
    data.distribution.name = info[0];
    socket.emit("get_distribution_packages", data)
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
}

function build_hash(data) {
  hash = "#"
  if (data.distribution && data.distribution.name) {
    hash = hash + data.distribution.name
    if (data.package && data.package.name && data.package.version) {
      hash = hash + '/' + data.package.name + "/" + data.package.version
      if (data.file && data.file.name)
      hash = hash + '/' + data.file.name
    }
  }
  return hash
}

var socket = io.connect('//localhost:3000');

socket.on('distributions', function(distributions) {
  $('#distributions ul').html('');
  distributions.forEach(function (name){
    $('#distributions ul').append('<li><a href="#' + name + '">' + name + '</li>');
  });
});

socket.on('distribution_packages', function(data){
  $('#packages ul').html('')
  tmp = data
  tmp.file = null
  data.distribution.packages.forEach(function(p){
    tmp.package = p
    div = $('#packages ul').append('<li><a href="' + build_hash(tmp) + '">'+ p.name + ' <span>'+p.version+'</span></a></li>')
  })
})

socket.on('package_file_list', function(data){
  $('#files ul').html('');
  tmp = data
  data.package.files.forEach(function(f){
    tmp.file = f
    $('#files ul').append('<li><a href="'+ build_hash(tmp) + '">' + f.name + '</a></li>')
  })
})

socket.on('file', function (data) {
  $("#file").html(data.file.content)
})

socket.on('file_newcontent', function(data) {
  new_html =  $("#file").html() + data.file.new_content
  $("#file").html(new_html)
})

socket.on('error', function() { console.error(arguments) });

$(window).on('hashchange', function() {
  get_path(window.location.hash.replace('#',''));
});

$(window).on('load', function (){
  get_path(window.location.hash.replace('#',''));
});
