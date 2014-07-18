'use strict';

var fs = require('fs'),
    Tail = require('tail').Tail;

Tail.prototype.watchEvent = function (e) {
    var _this = this;

    if (e === 'change') {
        return fs.stat(this.filename, function (err, stats) {
            if (err) {
                _this.emit('error', err);
                return;
            }
            if (stats.size < _this.pos) {
                _this.pos = stats.size;
            }
            if (stats.size > _this.pos) {
                _this.queue.push({
                    start: _this.pos,
                    end: stats.size
                });
                _this.pos = stats.size;
                if (_this.queue.length === 1) {
                    return _this.internalDispatcher.emit('next');
                }
            }
        });
    } else if (e === 'rename') {
        this.unwatch();
        _this.emit('error', 'File ' + this.filename + ' deleted.');
    }
};

Tail.prototype.close = function () {
    this.unwatch();
};

module.exports = Tail;
