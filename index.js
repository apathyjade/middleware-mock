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
const fs = require('fs')
require('json5/lib/register')

const cwd = process.cwd()
const noop = function () {}
// 初始化配置
let initCfg = noop

// 获取配置文件 没有则先初始化
const getCfg = (() => {
  let config = null
  initCfg = (params) => {
    let cfgPath = path.resolve(cwd, '.mock.config')
    let defCfg = {
      cfgPath: path.resolve(cwd, '.mock.config'),
      filePath: path.resolve(cwd, 'mock'),
      map: {},
      callback: ['callback', 'jsonpCallback'],
      hooks: {}
    }
    let setCfg = null
    if (typeof params === 'object') {
      cfgPath = ''
      setCfg = params
    } else {
      if (typeof params === 'string') {
        cfgPath = params
      }
      if (
        !fs.existsSync(cfgPath)
        && !fs.existsSync(cfgPath + '.js')
        && !fs.existsSync(cfgPath + '.json')
      ) {
        if (typeof params === 'string') {
          throw new Error(`config file '${cfgPath}' is no existed`)
        }
        setCfg = {}
      } else {
        setCfg = require(cfgPath)
      }
      
    }
    config = Object.assign({}, defCfg, setCfg)

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
const getFilePath = uriPath => {
  const config = getCfg()
  const {dealPath = path => path} = config.hooks
  return path.resolve(config.filePath, './' + (config.map[dealPath(uriPath)] || dealPath(uriPath)))
}
const get404Res = (mockPath, uriPath) => {
  return {
    type: 'mock',
    code: 404,
    msg: `'${path.resolve(mockPath)}' of '${uriPath}' mock is not existential`
  }
}
// 通过path 获取 mock数据
const getFileByPath = (uriPath, mockPath) => {
  try {
    let backData
    try {
      backData = require(mockPath)
    } catch (e) {}
    
    // 解决模块加载会有缓存问题， 每次清除cache
    let cachePath = require.resolve(mockPath)
    if (require.cache[cachePath]) {
      // 清除模块缓存
      delete require.cache[cachePath]
    }

    return backData
  } catch (e) {
    // 没有mock数据时返回
    return get404Res(mockPath, uriPath)
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

  const filePath = getFilePath(urlObj.pathname)
  if (!['', '.js', '.json', '.json5'].includes(path.extname(filePath))) {
    fs.readFile(filePath, (err, data) => {
      res.end(!err 
        ? data
        : dealMock2Str(get404Res(filePath, urlObj.pathname)))
    })
    return
  }

  // 读取本地 mock 文件内容
  let data = getFileByPath(urlObj.pathname, filePath)

  // mock 配置是动态方法时 先执行脚本
  if (typeof data === 'function') {
    data = data(req, res)
  }

  // 支持 promise
  data instanceof Promise ? data.then(dealData) : dealData(data)

  function dealData (data) {
    const config = getCfg()
    const {dealData = data => data} = config.hooks
    data = dealMock2Str(dealData(data))
    
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
