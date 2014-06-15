'use strict';

var config = require('../lib/config.js');

exports.index = function (req, res) {
    res.render('index', config);
};

exports.distribution = function (req, res) {
    res.render('distribution', config);
};

exports.preferences = function (req, res) {
    res.render('preferences', config);
};

exports.commands = function (req, res) {
    res.render('commands', config);
};
