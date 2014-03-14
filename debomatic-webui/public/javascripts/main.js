var socket = io.connect('//' + config.hostname );

var preferences = new Preferences()

new Page_Generic().init(socket)

if (window.location.pathname == config.paths.distribution) {
  new Page_Distrubion(socket).start()
}

else if (window.location.pathname == config.paths.preferences) {
  preferences.initPage()
}