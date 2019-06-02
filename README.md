# middleware-mock

本地开发的数据mock中间件

## 使用

``` javascript


const http = require('http')
const mock require('middleware-mock')

const server = http.createServer((req, res) => {
  mock(req, res)
});
server.listen(8000);

```