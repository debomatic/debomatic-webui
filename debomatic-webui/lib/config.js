/*
 *  Please DO NOT edit this file.
 *
 *  Edit auto-generated "user.config.js" file instead.
 *
 */

// #start config-auto-export
var config = {}

/*
 * Configure host and port.
 *  Please for ports < 1000 use authbind. DO NOT RUN nodejs as root.
 *  $ authbind nodejs index.js
 */
config.host = 'localhost'
config.port = 3000

config.socket = {}
config.socket.log = false

config.debomatic = {}
config.debomatic.path = '/srv/debomatic-amd64'
config.debomatic.jsonfile = '/var/log/debomatic-json.log'

config.routes = {}
config.routes.debomatic = '/debomatic'
config.routes.distribution = '/distribution'
config.routes.preferences = '/preferences'

config.web = {}
config.web.title = "Deb-o-Matic web.ui"
config.web.description = "This is a web interface for debomatic"

// debomatic configuration exportable for web
config.web.debomatic = {}
config.web.debomatic.admin = {}
config.web.debomatic.admin.name = "Your Name"
config.web.debomatic.admin.email = "you AT debian DOT org" // please use this SPAMFREE form - it will be converted client side by javascript
config.web.debomatic.architecture = 'amd64'

config.web.debomatic.dput = {}
config.web.debomatic.dput.incoming = config.debomatic.path
config.web.debomatic.dput.host = config.host
config.web.debomatic.dput.login = "debomatic"
config.web.debomatic.dput.method = "scp"
config.web.debomatic.dput.unsigned_uploads = false

// default ui settings
config.web.preferences = {}
config.web.preferences.autoscroll = true
config.web.preferences.header = true
config.web.preferences.sidebar = true
config.web.preferences.glossy_theme = true
config.web.preferences.file_background = true
config.web.preferences.file_fontsize = 13 // valid values are [13..16]
config.web.preferences.debug = 0      // debug level - 0 means disabled

// #end config-auto-export


// DO NOT TOUCH these ones

config.version = '0.1-b1'

// A simple function to quickly have
// get and set strings for client events
function _event_get_set(event_name) {
  return {
    set: event_name,
    get: 'get_' + event_name
  }
}

config.events = {}
config.events.error = 'error'
config.events.broadcast = {}
config.events.broadcast.distributions = 'distributions'
config.events.broadcast.status_update = 'status_update'

config.events.client = {}
config.events.client.distribution_packages = _event_get_set('distribution_packages')
config.events.client.distribution_packages.status = 'package_status'
config.events.client.package_files_list = _event_get_set('package_files_list')
config.events.client.file = _event_get_set('file')
config.events.client.file_newcontent = 'file_newcontent'
config.events.client.status = 'status'

// debomatic status according with JSONLogger.py module
config.status = {}
config.status.build = 'build'
config.status.create = 'create'
config.status.update = 'update'
config.status.success = true
config.status.fail = false

// read user configuration and merge it
/*
 * update object1 with object2 values
 */
function _merge(object1, object2) {
  var result = {}
  for (p in object1) {
    if (object2.hasOwnProperty(p)) {
      if (typeof object1[p] === 'object' && typeof object2[p] === 'object') {
        result[p] = _merge(object1[p], object2[p])
      }
      else {
        result[p] = object2[p]
      }
    }
    else {
      result[p] = object1[p]
    }
  }
  return result
}

try {
  var Parser = require('./parser.js')
  var parser = new Parser()
  var user_config = parser.getUserConfig()
  if (user_config) {
    console.log("Reading user configutation ...")
    config = _merge(config, require(user_config))
  }
  else {
    console.log("No user config specified. Using global settings.")
  }
} catch (err) {
  if (err.code == 'MODULE_NOT_FOUND') {
    console.log("File %s not found.", user_config)
    process.exit(1)
  }
  else {
    console.error("Error reading user configutation", err);
    process.exit(1)
  }
} finally {
  // export some variable
  config.web.paths = config.routes
  config.web.events = config.events
  config.web.status = config.status
  config.web.host = config.host
  module.exports = config
}
