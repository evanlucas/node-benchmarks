'use strict'

// Based on https://github.com/pillarjs/parseurl/blob/master/index.js
// Why are we not just using `parseurl` you may ask?
// `parseurl` adds properties to the `req` object during an http request
// This will cause a map transition for the `req`.

// One major difference between with this library is that
// it does not support setting req.url.
// Once this req has been parsed, if the url changes, the cache will
// not be updated.

const URL = require('url')
const parse = URL.parse
const Url = URL.Url
const qs = require('querystring')

const simplePathRegExp = /^(\/\/?(?!\/)[^\?#\s]*)(\?[^#\s]*)?$/

const cache = new WeakMap()

module.exports = parseurl

function parseurl(req) {
  const url = req.url

  if (url === undefined) return undefined
  if (cache.has(req)) {
    return cache.get(req)
  }

  const parsed = fastparse(url)
  cache.set(req, parsed)

  return parsed
}

function fastparse(str) {
  const simplePath = typeof str === 'string' && simplePathRegExp.exec(str)

  if (simplePath) {
    const pathname = simplePath[1]
    const search = simplePath[2] || null
    const url = new Url()
    url.path = str
    url.href = str
    url.pathname = pathname
    url.search = search
    if (search) {
      url.query = qs.parse(search.substr(1))
    } else {
      url.query = Object.create(null)
    }

    return url
  }

  return parse(str, true)
}
