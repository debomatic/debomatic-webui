var config = {}

config.host = 'localhost'
config.port = 3000

config.debomatic = {}
config.debomatic.path = '/srv/debomatic-amd64'
config.debomatic.webpath = '/debomatic'

config.web = {}
config.web.title = "deb-o-matic web.ui"
config.web.description = "This is a web interface for debomatic"
config.web.footer = "Fork me on github.com"
config.web.autoscroll = true

module.exports = config
