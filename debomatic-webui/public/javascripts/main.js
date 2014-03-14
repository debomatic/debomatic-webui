var socket = io.connect('//' + config.hostname );
/*
  General indication for debugging use:

  usage: debug(level, args)

  args: can be everything

  level: 1 - user interaction
         2 - automatic changes
         3 - socket interaction
*/
var debug = function() {
  if (arguments.length == 0) {
    return
  }
	var level = 1
	if (arguments.length > 2) {
		level = arguments[0]
    arguments[0] = "debug (" + level + ") > "
    if (level <= config.preferences.debug) {
      if (console.debug)
        console.debug.apply(console, arguments)
      else
        console.log.apply(console, arguments)
    }
  }
}

new Preferences()

new Page_Generic().init(socket)

if (window.location.pathname == config.paths.distribution) {
  new Page_Distrubion(socket).start()
}