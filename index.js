/*
 * @Author: apathyjade <apathyjade@outlook.com>
 * @Version: 0.0.1
 * @Date: 2019-05-29 10:50:57
 * @Last Modified by:   apathyjade
 * @Last Modified Time: 2019-05-29 10:50:57
 */

const path = require('path')
const url = require('url')
const qs = require('querystring')

const cwd = process.cwd()

// 初始化配置
let initCfg

// 获取配置文件 没有则先初始化
const getCfg = (() => {
  let config = null
  initCfg = () => {
    config = Object.assign({
      path: path.resolve(cwd, 'mock'),
      callback: ['callback', 'jsonpCallback'],
      hooks: {}
    }, require(path.resolve(cwd, '.mock.config')))
    
    // 处理 callback 为 Array 类型
    if (typeof config.callback === 'string') {
      config.callback = [config.callback]
    }
  }
  return () => {
    if (!config) {
      initCfg()
    }
    return config
  }
})()

// 延迟执行
const delay = (fn, t = 400) => {
  setTimeout(() => {
    fn()
  }, t)
}

// 通过path 获取 mock数据
const getFileByPath = uriPath => {
  const config = getCfg()
  const mockPath = path.resolve(config.path, config.map[uriPath] || `.${uriPath}`)
  try {
    let backData = require(mockPath)
    // 解决模块加载会有缓存问题， 每次清除cache
    let cachePath = require.resolve(mockPath)
    require.cache[cachePath] && delete require.cache[cachePath]
    return backData
  } catch (e) {
    // 没有mock数据时返回
    return {
      type: 'mock',
      code: 404,
      msg: `'${path.resolve(mockPath)}' of '${uriPath}' mock is not existential`
    }
  }
}

// 处理 mock 文件内容 转成 string 类型
const dealMock2Str = (data) => {

  // 字符串直接返回
  if (typeof data === 'string') {
    return data
  }

  // 对于对象 转成 字符串
  if (typeof data === 'object') {
    return JSON.stringify(data)
  }

  // 对于其他非字符串类型 转成字符串
  return String(data)
}

function mock (req, res) {

  // 格式化 url 和 url参数
  const urlObj = url.parse(req.url)
  const params = qs.parse(urlObj.query)
  const config = getCfg()
  // 读取本地 mock 文件内容
  let data = getFileByPath(urlObj.pathname)

  // mock 配置是动态方法时 先执行脚本
  if (typeof data === 'function') {
    data = data(req, res)
  }

  data instanceof Promise ? data.then(dealData) : dealData(data)

  function dealData (data) {
    data = dealMock2Str(data)
    
    // 由于 mock 数据同步获取到 返回过快的话 前端的异步效果会同步既视感  这里做一个，异步延迟返回
    delay(() => {
      // 处理 jsonp 返回 配置
      let cbKey = config.callback.find(it => params[it])
      let callback = cbKey && params[cbKey]
      res.end(callback ? `${callback}(${data})` : data)
    })
  }
}
mock.initCfg = initCfg
module.exports = mock
