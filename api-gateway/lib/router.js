'use strict'

const http = require('http')
const url = require('url')
const parseurl = require('./parseurl')
const log = require('./log').child('router')
const store = require('./store')

const APPLICATION_JSON = 'application/json'
const NOT_FOUND = JSON.stringify({
  message: 'Not found'
})
const NOT_AUTHORIZED = JSON.stringify({
  message: 'Not authorized'
})
const SOCKET_ERROR = JSON.stringify({
  message: 'Unable to complete request. Please try again later.'
})

const apis = new Map()

apis.set('/biscuits', {
  target: 'http://localhost:4000'
})

apis.set('/butter', {
  target: 'http://localhost:5000'
})

module.exports = gateway

function gateway(req, res) {
  const method = req.method
  const parsed = parseurl(req)
  const pathname = parsed.pathname

  log.verbose('request', {
    method
  , url: req.url
  })

  const slash_idx = pathname.indexOf('/', 1)
  const l = slash_idx === -1 ? pathname.length : slash_idx
  const prefix = pathname.slice(0, l)

  const api = apis.get(prefix)
  if (api) {
    return handle(req, res, api)
  }

  res.writeHead(404, {
    'content-type': APPLICATION_JSON
  })
  res.end(NOT_FOUND)
}

function handle(req, res, api) {
  const auth = req.headers.authorization
  if (!auth) {
    log.warn('missing auth header')
    return fail(res)
  }

  store.touch(auth, (err, session) => {
    if (err) {
      if (err.code !== 'ENOENT') {
        log.error(err)
      }

      return fail(res)
    }

    log.silly('session', session)

    proxy(req, res, api, session)
  })
}

function proxy(req, res, api, session) {
  const outbound = url.parse(api.target)
  outbound.method = req.method
  outbound.path = outbound.pathname = req.url

  outbound.headers = {
    'content-type': req.headers['content-type'] || APPLICATION_JSON
  , connection: 'close'
  }

  const headers = req.headers
  const keys = Object.keys(headers)

  for (var i = 0; i < keys.length; i++) {
    const key = keys[i]
    outbound.headers[key] = headers[key]
  }

  const proxy = http.request(outbound)

  function onError(err) {
    if (req.socket.destroyed && err.code === 'ECONNRESET') {
      return proxy.abort()
    }

    log.error(err)
    socketError(res)
  }

  proxy.on('error', onError)
  req.on('error', onError)

  req.on('aborted', () => {
    proxy.abort()
  })

  proxy.once('response', (proxy_res) => {
    log.verbose('response', {
      statusCode: proxy_res.statusCode
    , headers: proxy_res.headers
    })

    res.writeHead(proxy_res.statusCode, proxy_res.headers)
    // res.statusCode = proxy_res.statusCode
    // const keys = Object.keys(proxy_res.headers)
    // for (var i = 0; i < keys.length; i++) {
    //   res.setHeader(keys[i], proxy_res.headers[keys[i]])
    // }

    proxy_res.pipe(res)
  })

  req.pipe(proxy)
}

function fail(res) {
  res.writeHead(401, {
    'content-type': APPLICATION_JSON
  })
  res.end(NOT_AUTHORIZED)
}

function socketError(res) {
  res.writeHead(503, {
    'content-type': APPLICATION_JSON
  })
  res.end(SOCKET_ERROR)
}
