# 0.5.1 (2015-06-17)
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
