const resolverUtils = require('../resolverUtils.js')
const cheerio = require('cheerio')

module.exports = {
  resolve: async function(key){
    const result = {}
    // 支持输入资源地址
    if(/^https:\/\/apps\.apple\.com\/cn\/app\/(.+)\/id(\d{9})/.test(key)){
      result.channelName = decodeURIComponent(RegExp.$1)
      result.resourceUrl = result.openResourceUrl = key
    } else{
      return {
        errCode: 401,
        errMsg: '请重新输入'
      }
    }

    // 验证有效
    const html = await resolverUtils.request(result.resourceUrl)
    const $ = cheerio.load(html)
    if($('div').length){
      return result
    }

    return {
      errCode: 404,
      errMsg: '未发现app'
    }
  }
}