// main client javascript

var preferences = new Preferences()

var page_generic = new Page_Generic()

if (window.location.pathname == config.paths.preferences) {
  preferences.initPage()
}

if (window.location.pathname == '/') {
  // convert email addresses in the right format
  var emails = $(".email")
  $.each(emails, function (){
    var subject = ''
    if ($(this).attr('subject')) {
      subject = '?subject=' + $(this).attr('subject')
    }
    var real_email = $(this).html().replace('AT','@').replace('DOT','.').replace(/ /g,'')
    real_email = '<a href="mailto:' + real_email + subject + '">' + real_email + '</a>'
    $(this).html(real_email)
  })
}

var socket = io.connect('/');

page_generic.start(socket)

if (window.location.pathname == config.paths.distribution) {
  new Page_Distrubion(socket).start()
}