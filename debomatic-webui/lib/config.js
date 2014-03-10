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
config.web.paths = config.routes
config.web.hostname = config.host + ((config.port == 80) ? null : ':' + config.port)

module.exports = config
