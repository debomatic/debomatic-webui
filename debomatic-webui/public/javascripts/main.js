var socket = io.connect('//' + config.hostname );

var preferences = new Preferences()

var page_generic = new Page_Generic(socket)

if (window.location.pathname == config.paths.distribution) {
  new Page_Distrubion(socket).start()
}

else if (window.location.pathname == config.paths.preferences) {
  preferences.initPage()
}