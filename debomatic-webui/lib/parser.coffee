/*jshint multistr: true */
'use strict';

function Parser() {

    var args = process.argv.slice(2);

    var help = function () {
        console.log('\
Usage: %s [-c config]\n\
  -h    print this help \n\
  -c    set user configuration file',
            process.argv[1].split('/').pop());

        process.exit(0);
    };

    this.getUserConfig = function () {
        var configFile = null;
        args.forEach(function (val, index) {
            if (val == '-c') {
                configFile = args[index + 1];
                return;
            }
        });
        if (configFile)
            return process.cwd() + '/' + configFile;
        else
            return null;
    };

    args.forEach(function (val, index) {
        if (val == '-h') {
            help();
        }
    });
}

module.exports = Parser;
