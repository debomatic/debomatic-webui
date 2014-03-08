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
  $('#distributions li').removeClass('active')
  $('#distribution-' + data.distribution.name).addClass('active')
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

function update_breadcrumb(hash) {
  new_html = ''
  new_hash = '#'
  info = hash.split('/')
  for (var i = 0; i < info.length ; i++) {
    new_hash += info[i]
    if (i == (info.length - 1))
      new_html += '<li class="active">' + info[i] + '</li>'
    else
      new_html += '<li><a href="' + new_hash + '">' + info[i] + '</a>'
    new_hash += '/'
  }
  $('.breadcrumb').html(new_html)
}

var socket = io.connect('//localhost:3000');

socket.on('distributions', function(distributions) {
  $('#distributions ul').html('');
  distributions.forEach(function (name){
    $('#distributions ul').append('<li id="distribution-' + name +'"><a href="#' + name + '">' + name + '</li>');
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
  $('#debs ul').html('');
  $('#archives ul').html('')
  tmp = data
  data.package.files.forEach(function(f){
    tmp.file = f
    $('#files ul').append('<li><a name="'+ f.orig_name +'" href="'+ build_hash(tmp) + '">' + f.name + '</a></li>')
  })
  
  data.package.debs.forEach(function(f){
    $('#debs ul').append('<li><a name="'+ f.orig_name +'" href="' + f.path + '">' + f.name  +'</a> <span>.' + f.label + '</span></li>')
  })
  
  data.package.archives.forEach(function(f){
    $('#archives ul').append('<li><a name="'+ f.orig_name +'" href="' + f.path + '">' + f.name  +'</a></li>')
  })
})

socket.on('file', function (data) {
  $('#file .title').html(data.file.orig_name)
  $("#file pre").html(data.file.content)
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
