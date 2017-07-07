'use strict'

const http = require('http')
const port = process.env.PORT || 4000

const server = http.createServer(handle)
server.listen(port, () => {
  console.log('listen', server.address().port)
})

const str = JSON.stringify({
  message: 'success'
})

function handle(req, res) {
  res.end(str)
}
