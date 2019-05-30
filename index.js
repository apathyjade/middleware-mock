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
const noop = function() {}
// 配置
const config = Object.assign({
  path: path.resolve(cwd, 'mock'),
  callback: ['callback', 'jsonpCallback'],
  hooks: {

  }
}, require(path.resolve(cwd, '.mock.config')))

if (typeof config.callback === 'string') {
  config.callback = [config.callback]
}

// 延迟执行
const delay = (fn, t = 400) => {
  setTimeout(() => {
    fn()
  }, t)
}

// 通过path 获取 mock数据
const getFileByPath = uriPath => {
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

module.exports =  function(req, res) {

  // 格式化 url 和 url参数
  const urlObj = url.parse(req.url)
  const params = qs.parse(urlObj.query)
  // 读取本地 mock 文件内容
  let data = getFileByPath(urlObj.pathname)
  // mock 配置是动态方法时 先执行脚本
  if (typeof data === 'function') {
    data = data(req, res)
  }
  // 对于对象 转成 字符串
  if (typeof data === 'object') {
    data = JSON.stringify(data)
  }

  // 对于其他非字符串类型 转成字符串
  if (typeof data !== 'string') {
    data = String(data)
  }
  // 由于 mock 数据同步获取到 返回过快的话 前端的异步效果会同步既视感  这里做一个，异步延迟返回
  delay(() => {
    // 处理 jsonp 返回 配置
    let cbKey = config.callback.find(it => params[it])
    let callback = cbKey && params[cbKey]
    res.end(callback ? `${callback}(${data})` : data)
  })
}
