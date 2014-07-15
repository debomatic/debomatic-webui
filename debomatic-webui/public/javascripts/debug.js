"use strict";
/*
  General information about debugging:

  usage: debug(level, args)

  args: can be anything

  level: 1 - user interaction
         2 - automatic changes
         3 - socket emit data
         4 - socket received data
*/
var debug = function () {
    if (arguments.length < 2) {
        return;
    }
    var level = arguments[0];
    arguments[0] = "debug [" + level + "]:";
    if (level <= config.preferences.debug) {
        if (console.debug)
            console.debug.apply(console, arguments);
        else
            console.log.apply(console, arguments);
    }
};

/*
  An helper debug function for socket events

  usage: debug_socket("emit"|"received", event_name, data)
*/

var debug_socket = function () {
    if (arguments.length != 3)
        return;
    var level = 3;
    if (arguments[0] == "received")
        level = 4;
    debug(level, "socket", arguments[0], "event:", arguments[1], "data:", arguments[2]);
};
