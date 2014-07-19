###
debomatic-webui user configuration
###

###
Init some values, do not touch these
###
config = {}
config.debomatic = {}
config.web = {}
config.web.debomatic = {}
config.web.debomatic.admin = {}
config.web.debomatic.dput = {}
config.web.file = {}
config.web.preferences = {}

###
Configure host and port
###
config.host = "localhost"
config.port = 3030

###
Deb-O-Matic settings
###
config.debomatic.path = "debomatic/dir"
config.debomatic.jsonfile = "debomatic/json.log"

###
List of files to get a simple preview and number of lines
to show
###
config.web.file.preview = ["buildlog"]
config.web.file.num_lines = 25


# DO NOT EDIT THIS LINE:
module.exports = config
