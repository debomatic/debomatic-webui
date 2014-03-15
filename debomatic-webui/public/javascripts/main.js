var socket = io.connect('//' + config.hostname );

var preferences = new Preferences()

var page_generic = new Page_Generic(socket)

if (window.location.pathname == config.paths.distribution) {
  new Page_Distrubion(socket).start()
}

else if (window.location.pathname == config.paths.preferences) {
  preferences.initPage()
}

else if (window.location.pathname == '/') {
  // convert email addresses in the right format
  var emails = $(".email")
  $.each(emails, function (){
    var real_email = $(this).html().replace('AT','@').replace('DOT','.').replace(/ /g,'')
    real_email = '<a href="mailto:' + real_email + '">' + real_email + '</a>'
    $(this).html(real_email)
  })
}