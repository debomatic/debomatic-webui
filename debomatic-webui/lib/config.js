var config = {}

config.host = 'localhost'
config.port = 3000

config.debomatic = {}
config.debomatic.path = '/srv/debomatic-amd64'
config.debomatic.jsonfile = '/var/log/debomatic.json'

config.routes = {}
config.routes.debomatic = '/debomatic'
config.routes.distribution = '/distribution'
config.routes.preferences = '/preferences'

config.web = {}
config.web.title = "deb-o-matic web.ui"
config.web.description = "This is a web interface for debomatic"
config.web.footer = "Fork me on github.com"

// default ui settings
config.web.preferences = {}
config.web.preferences.autoscroll = true
config.web.preferences.header = true
config.web.preferences.sidebar = true
config.web.preferences.debug = 0      // debug level - 0 means disabled

// DO NOT EDIT these ones

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

config.status = {}
config.status.package = {}
config.status.package.building = 'building'
config.status.package.failed = 'build-failed'
config.status.package.successed = 'build-successed'

// export some variable
config.web.paths = config.routes
config.web.events = config.events
config.web.status = config.status
config.web.hostname = config.host + ((config.port == 80) ? '' : ':' + config.port)

module.exports = config
