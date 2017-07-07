'use strict'

'use strict'

// Most of this is taken from
// https://github.com/kelektiv/node-uuid/blob/master/lib/bytesToUuid.js
// Why didn't we use uuid?
// String#replace would cause a perf hit and we don't want hypens

const crypto = require('crypto')
const uuid = require('uuid')

const h = []
for (var i = 0; i < 256; i++) {
  h[i] = (i + 0x100).toString(16).substr(1)
}

function generateToken() {
  const buf = crypto.randomBytes(16)
  buf[6] = (buf[6] & 0x0f) | 0x40
  buf[8] = (buf[8] & 0x3f) | 0x80

  const str = (
    h[buf[0]] + h[buf[1]]
  + h[buf[2]] + h[buf[3]]
  + h[buf[4]] + h[buf[5]]
  + h[buf[6]] + h[buf[7]]
  + h[buf[8]] + h[buf[9]]
  + h[buf[10]] + h[buf[11]]
  + h[buf[12]] + h[buf[13]]
  + h[buf[14]] + h[buf[15]]
  )

  return crypto.createHash('sha1').update(str).digest('hex')
}

const token = generateToken()
const ttl = 86400
const id = uuid.v4()
const store = require('./lib/store')
store.connect(() => {
  const session = {
    id
  , expires: Date.now() + (86400 * 1000)
  }
  store.set({session, token, ttl}, (err) => {
    if (err) {
      console.error(err)
      process.exitCode = 1
    } else {
      console.log(token)
    }
    store.disconnect()
  })
})
