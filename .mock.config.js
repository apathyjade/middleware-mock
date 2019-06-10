/*
 * @Author: apathyjade <apathyjade@outlook.com>
 * @Version: 0.0.1
 * @Date: 2019-05-29 20:11:58
 * @Last Modified by:   apathyjade
 * @Last Modified Time: 2019-05-29 20:11:58
 */
const path = require('path')
module.exports = {
  filePath: path.resolve(__dirname, 'test/mock'),
  map: {
    // 获取绑定银行卡列表
    '/api/pay/bank-card/bind/list/get.json': './a.json'
  },
  callback: ['a', 'asd'],
  hooks: {
    dealPath (path) {
      console.log(path)
      return path + '.json'
    },
    dealData (data) {
      data.asd = 123
      return data
    }
  }
}