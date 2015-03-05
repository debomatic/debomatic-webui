# 1.2.0 (2015-03-05)
 * [new] align webui with sbuild debomatic codebase - closes #8
 * [new] use compression by default for all request - save bandwith
 * [new] add semating tags for log files
 * [new] add support to gravatar
 * [new] add support for "system" as debomatic.architecture
 * [new] [libraries] update tablesort, chartist and bootstrap
 * [fix] corecttly show too long package versions
 * [fix] update debomatic URL homepage - closes #10
 * [fix] commands: add binnmu and update buildep - closes #9

# 1.1.0 (2014-12-19)
 * [new] [module] change names to Start and Stop
 * [new] [module] add parser for blhc log file
 * [new] history page
 * [new] show file size for package files
 * [new] disable autoscroll pressing on "back on top" panel
 * [new] log files can be now showed directly in the browsers
 * [new] update to chartist-js 0.4.0
 * [fix] [module] use readline while parsing piuparts log file
 * [fix] add support to sourceupload.changes
 * [fix] add support to source format 1.0 - closes #6
 * [fix] do not mess up when there are too many deb pacakges - close #7

# 1.0.0 (2014-07-23)
 * Migrate to coffee-script, code refactory
 * [new] style - more focus on files content
 * [new] removed useless header, save space
 * [new] move git repo to debomatic organization in github
 * [fix] merge correctly user configuration - closes #2
 * [fix] read correctly user configuration with absolute path - closes #3
 * [fix] wait for the creation of the json log if does not exists - closes #4

# 0.6.0 (2014-07-10)
 * [new] [module] write a JSON file about package status in its own directory
 * [new] update to socket.io 1.x
 * [new] enable icons and details in static debomatic directory listening
 * [new] get status of package via socket instead of making a GET request
 * [new] add clean button to package search
 * [new] double click on a package in the list make an automatic search
 * [new] add slide up and down effect while searching packages
 * [new] set files list to not send to client as configurable
 * [fix] prevent crashes filtering out request to chroots - send back 403 HTTP status - closes #1
 * [fix] escape correctly HTML in file content
 * [fix] auto-populate page on socket connect instead of on page loads
 * [fix] preferences does not set correctly if value is false
 * [fix] better and smaller error messages
 * [fix] fix some style issues

# 0.5.1 (2014-06-17)
 * [fix] recursive call on receive file new_content while view the whole file
 * [fix] improved style for file view and datestamp
 * [fix] documentation set porter command instead of rebuild

# 0.5.0 (2014-06-16)
 * [new] add packages search bar
 * [new] get buildlog preview by default instead of datestamp when click on a package
 * [new] always show datestamp information below the title
 * [new] add page Commands which documents out the tasks interface of Deb-o-Matic
 * [new] better tooltip over the action buttons (such as Download, View al file, Get all)
 * [new] show the debomatic architecture in the header description
 * [new] show architecture and version in footer if header is hidden in preferences
 * [fix] system crashes when watch a file and it gets deletion
 * [fix] never loses first errors received client side

# 0.4.2 (2014-06-15)
 * [fix] calculate pidfile for debomatic status check after merging configurations

# 0.4.1 (2014-06-13)
 * [fix] preview file using a fixed max-height on new content
 * [fix] show and hide correctly debomatic status when build packages
 * [fix] reduce update delay when get new content (now 150 ms)

# 0.4.0 (2014-06-12)
 * [new] always show only max_lines in preview, also when new_content is recevied
 * [new] get debomatic real status by reading pidfile in /var/run directory
 * [new] by default package in status bar links to buildlog file instead of datestamp
 * [new] add History file

# 0.3.0 (2014-06-09)
 * [new] files can have a preview

# 0.2.4 (2014-06-09)
 * [fix] bugs relative to jshint validation

# 0.2.3 (2014-06-06)
 * [new] get all sources in one click
 * [fix] code validatation via jshint

# 0.2.2 (2014-06-04)
 * [fix] upgrade to express 4.x

# 0.2.1 (2014-04-13)
 * [fix] some style bugs

# 0.2.0 (2014-04-08)
 * [new] get all debs in one click
 * [new] enaled glossy theme by default
 * [new] window with has a rationale title
 * [new] improved welcome messages
 * [new] upgrade to express 3.x
 * [new] handle with debomatic pre_chroot and post_chroot hooks
 * [new] add options -c and -h to cli script
 * [fix] back on tail module instead of tailfd
 * [fix] sticky bar
 * [fix] serve js and css with a version number
 * [fix] add new content to file using append() - reduce cpu usage
 * [fix] many other bugs fix

# 0.1.0 (2014-04-07)
 * Initial release
