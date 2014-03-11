var config = {}

config.host = 'localhost'
config.port = 3000

config.debomatic = {}
config.debomatic.path = '/srv/debomatic-amd64'
config.debomatic.jsonfile = '/var/log/debomatic.json'

config.routes = {}
config.routes.debomatic = '/debomatic'
config.routes.distribution = '/distribution'

config.web = {}
config.web.title = "deb-o-matic web.ui"
config.web.description = "This is a web interface for debomatic"
config.web.footer = "Fork me on github.com"
config.web.autoscroll = true


// do not edit these ones
config.events = {}
config.events.broadcast = {}
config.events.broadcast.distributions = 'distributions'
config.events.broadcast.status_update = 'status_update'


function __build_get_set(event_name) {
  return {
    set: event_name,
    get: 'get_' + event_name
  }
}

config.events.client = {}
config.events.client.distribution_packages = __build_get_set('distribution_packages')
config.events.client.distribution_packages.status = 'package_status'
config.events.client.package_files_list = __build_get_set('package_files_list')
config.events.client.file = __build_get_set('file')
config.events.client.file_newcontent = 'file_newcontent'
config.events.client.status = 'status'

config.web.paths = config.routes
config.web.events = config.events
config.web.hostname = config.host + ((config.port == 80) ? null : ':' + config.port)

module.exports = config
