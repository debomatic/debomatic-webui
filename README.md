debomatic-webui
===============

**debomatic-webui** is a web interface for [Deb-o-Matic](https://launchpad.net/debomatic) aims to give to users a simple way to browse logs and to know what's going on debomatic build service providing a real-time packages status.
This interface is built up on [node](http://nodejs.org/) platform and uses intensely [socket.io](http://socket.io/) and [jquery](http://jquery.com/) technologies.
Whenever you want to leave a suggestion or file a bug report, please open a [new issue](https://github.com/LeoIannacone/debomatic-webui/issues).

## Installation

Installation is very simple.

1. First of all, you need `npm` and `nodejs` installed on your system. On debian like systems type this in a command line:
 ```
sudo apt-get install npm nodejs
```

2. Then move to `debomatic-webui/` directory and type:
 ```
npm install
```
 That command downloads node depenences locally and creates the `user.config.js` file.

2. Take a look at `user.config.js`. Edit as you wish and then run service with:
 ```
nodejs index.js
```

That's all.