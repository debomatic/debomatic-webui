var socket = io.connect('//' + config.hostname );

new Page_Generic().init(socket)

if (window.location.pathname == config.paths.distribution) {
  new Page_Distrubion().init(socket)
}
