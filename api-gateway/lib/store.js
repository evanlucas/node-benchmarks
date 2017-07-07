'use strict'

const redis = require('redis')
const log = require('./log').child('store')
const ttl = 86400

class SessionStore {
  constructor(uri) {
    this.db = redis.createClient(uri)
  }

  // Call on same tick as the constructor
  connect(cb) {
    log.info('connecting')
    this.db.once('ready', cb)
  }

  disconnect() {
    this.db.quit()
  }

  get(token, cb) {
    this.db.get(token, (err, str) => {
      if (err) return cb(err)
      if (!str) {
        const er = new Error('Key not found')
        er.code = 'ENOENT'
        return cb(er)
      }

      const out = tryParseJSON(str)
      cb(null, out)
    })
  }

  set({session, token, ttl}, cb) {
    const val = JSON.stringify(session)
    this.db.setex(token, ttl, val, (err) => {
      cb(err)
    })
  }

  // This should probably be atomic
  touch(token, cb) {
    this.get(token, (err, session) => {
      if (err) return cb(err)

      const expires = Date.now() + (ttl * 1000)
      session.expires = expires

      this.set({session, token, ttl}, (err) => {
        cb(err, session)
      })
    })
  }
}

const url = process.env.REDIS_URL || 'redis://localhost:6379'
module.exports = new SessionStore(url)

function tryParseJSON(str) {
  try {
    return JSON.parse(str)
  } catch (_) {
    return undefined
  }
}
