"use strict"
config = require("../lib/config")
exports.index = (req, res) ->
    res.render "index", config
    return

exports.distribution = (req, res) ->
    res.render "distribution", config
    return

exports.preferences = (req, res) ->
    res.render "preferences", config
    return

exports.commands = (req, res) ->
    res.render "commands", config
    return
