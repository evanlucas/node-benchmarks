#!/usr/bin/env node

const path = require('path')
const {exec, spawn} = require('child_process')
const log = require('../lib/log').child('bench')
const svc = path.join(__dirname, '..', 'service.js')
const index = path.join(__dirname, '..', 'index.js')

const biscuits = spawn(process.execPath, [svc], {
  cwd: path.join(__dirname, '..')
, env: {
    PORT: 4000
  }
, stdio: 'inherit'
})

const butter = spawn(process.execPath, [svc], {
  cwd: path.join(__dirname, '..')
, env: {
    PORT: 5000
  }
, stdio: 'inherit'
})

const proxy = spawn(process.execPath, [index], {
  cwd: path.join(__dirname, '..')
, env: {
    PORT: 8080
  , LOGLEVEL: 'warn'
  }
, stdio: 'inherit'
})

pipe(biscuits, 'biscuits')
pipe(butter, 'butter')
pipe(proxy, 'proxy')

setTimeout(() => {
  log.info('setting up benchmarks')
  createSession()
}, 5000)

function createSession() {
  const fp = path.join(__dirname, '..', 'create-session.js')
  const bin = `${process.execPath} ${fp}`
  exec(bin, (err, stdout, stderr) => {
    if (err) throw err
    const auth = stdout.trim()
    log.info('got session', auth)
    wrk(auth)
  })
}

const wrk_cmd = 'wrk http://localhost:8080/biscuits -d10s -c 100 -t 2'

function wrk(auth) {
  log.info('running benchmark...this should take ~10 seconds')
  const cmd = wrk_cmd + ` -H 'authorization: ${auth}' | grep Requests/sec | awk '{print $2}'`
  exec(cmd, (err, stdout, stderr) => {
    if (err) throw err
    log.info('%s req/s', stdout.trim())
    teardown()
  })
}

function pipe(stream, name) {
  const logger = log.child(name)

  stream.on('close', (code, signal) => {
    logger.verbose('close', {code, signal})
  })
}

process.on('SIGTERM', teardown)

function teardown() {
  biscuits.kill('SIGTERM')
  butter.kill('SIGTERM')
  proxy.kill('SIGTERM')
}
