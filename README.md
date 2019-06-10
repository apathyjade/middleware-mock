# middleware-mock

本地开发的数据mock中间件

## 安装

``` shell

npm install middleware-mock -S

```

## 使用

``` javascript

const http = require('http')
const mock = require('middleware-mock')
/**
mock.initCfg({
  filePath: '',
  map: {},
  callback: [],
  hooks: {}
})
*/
const server = http.createServer((req, res) => {
  mock(req, res)
});
server.listen(8000);

```

## document

### 配置文件

* 默认读取项目根目录（process.cwd()）下  .mock.config.js  文件

#### example

```javascript
const path = require('path')
module.exports = {
  // mock 文件目录, default: ./mock
  filePath: path.resolve(__dirname, 'test/mock'),
  // 接口和mock文件映射
  map: {
    // 获取绑定银行卡列表
    '/api/pay/bank-card/bind/list/get.json': './a.json'
  },
  // 配置 jsonp key default: ['callback', 'jsonpCallback']
  callback: ['xxx1', 'xxxx2'],
  hooks: {
    // 处理请求地址的钩子函数，在 map 前调用
    dealPath (path) {
      return path + '.json'
    },
    // 处理mock数据钩子函数， 在stringify 和 jsonp格式化前调用
    dealData (data) {
      data.asd = 123
      return data
    }
  }
}
```

### mock file

支持json、json5、js, 无后缀时优先级：js > json > json5

#### js mock 说明

```javascript
// example 1
module.exports = 'mock'
module.exports = {name: 'mock'}

// example 2 异步 promise 支持
module.exports = async function (req, res) {
  return new Promise((r) => {
    setTimeout(() => {
      r('1qqqqwqw')
    }, 200)
  })
}

// example 3 直接操作 req 和 res 对象
module.exports = function (req, res) {
  res.end('结束')
}

```

#### json mock 说明

```json
{
  "key": "name"
}
```

#### json5 mock 说明

```json5
// 配置说明
{
  // 定义的key
  key: 'name' // 注释
}
```
