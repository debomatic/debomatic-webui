var socket = io.connect('//' + config.hostname );

var debug = function() {
  if (arguments.length == 0) {
    return
  }
	var level = 1
	if (arguments.length > 1) {
		level = arguments[0]
    arguments[0] = "dubug (" + level + ") > "
  }
	if (level <= config.preferences.debug) {
    console.log.apply(console, arguments)
	}
}

new Preferences()

new Page_Generic().init(socket)

if (window.location.pathname == config.paths.distribution) {
  new Page_Distrubion(socket).start()
}