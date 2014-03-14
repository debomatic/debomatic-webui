var socket = io.connect('//' + config.hostname );

new Preferences()

new Page_Generic().init(socket)

if (window.location.pathname == config.paths.distribution) {
  new Page_Distrubion(socket).start()
}