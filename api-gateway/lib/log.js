'use strict'

const Log = require('kittie').Log

const log = new Log({
  inheritLogLevel: true
, maxComponentLength: 15
})

log.level = process.env.LOGLEVEL || 'info'

module.exports = log
