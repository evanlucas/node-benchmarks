'use strict'

const http = require('http')
const log = require('./lib/log').child('server')
const store = require('./lib/store')
const router = require('./lib/router')
const port = process.env.PORT || 8080

const server = http.createServer(router)
log.warn('node', process.version)

store.connect(() => {
  log.info('store connected')
  server.listen(port, () => {
    log.info('proxy listen', server.address().port)
  })
})

const onSignal = (signal) => {
  return () => {
    server.close(() => {
      store.disconnect()
    })
  }
}

process.once('SIGTERM', onSignal('SIGTERM'))
