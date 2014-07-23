debomatic-webui
===============

**debomatic-webui** is a web interface for [Deb-o-Matic](https://launchpad.net/debomatic) aims to give to users a simple way to browse logs and to know what's going on debomatic build service providing a real-time packages status.
This interface is built up on [node](http://nodejs.org/) platform and uses intensely [socket.io](http://socket.io/) and [jquery](http://jquery.com/) technologies.
Whenever you want to leave a suggestion or file a bug report, please open a [new issue](https://github.com/LeoIannacone/debomatic-webui/issues).

Some **debomatic-webui** instances are already running over:
 * http://debomatic-amd64.debian.net
 * http://debomatic-i386.debian.net
 * http://debomatic-armel.debian.net
 * http://debomatic-armhf.debian.net
 * http://debomatic-powerpc.debian.net

## Requirements

You need **JSONLogger** debomatic module (provided along with this interface) to get installed in debomatic, type this in a command line:
```
sudo ln -s `pwd`/debomatic-modules/JSONLogger.py /usr/share/debomatic/modules/00_JSONLogger.py
sudo ln -s `pwd`/debomatic-modules/JSONLogger.py /usr/share/debomatic/modules/ZZ_JSONLogger.py
```
Restart debomatic service.


Install **npm** and **nodejs** on your system. On debian like systems type this in a command line:
```
sudo apt-get install npm nodejs nodejs-legacy
```

## Installation

You have to install node dependencies locally, creates automatically the user configuration file and install **coffee-script** globally. Move to **debomatic-webui/** directory and type:
```
npm install
sudo npm install -g coffee-script
```


## Usage

Take a look at auto-generated **user.config.coffee**.  Edit as you wish and then run service with:
```
coffee debomatic-webui -c user.config
```

That's all.
