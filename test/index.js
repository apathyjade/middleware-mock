/*
 * @Author: apathyjade <apathyjade@outlook.com>
 * @Version: 0.0.1
 * @Date: 2019-05-29 20:17:26
 * @Last Modified by:   apathyjade
 * @Last Modified Time: 2019-05-29 20:17:26
 */

const http = require('http');
const mock = require('../index')
const path = require('path')
// mock.initCfg(path.resolve(__dirname, '../.mock.config'))
mock.initCfg({
  filePath: path.resolve('./test/mock'),
  map: {
    '/png': '/png.png'
  },
  callback: [],
  hooks: {
    
  }
})

// Create an HTTP server
const server = http.createServer((req, res) => {
  mock(req, res)
});
server.listen(8000);