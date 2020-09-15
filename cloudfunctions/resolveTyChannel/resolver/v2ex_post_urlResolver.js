const resolverUtils = require('../resolverUtils.js')
const cheerio = require('cheerio')

module.exports = {
  resolve: async function(key){
    let result = {
      resourceUrl: `https://v2ex.com/t/${key}`,
      openResourceUrl: `https://v2ex.com/t/${key}`
    }
    // 支持输入资源地址
    if(/^https:\/\/v2ex.com\/t\/(\d+)/.test(key)){
      result.resourceUrl = result.openResourceUrl = key
    }

    // 得到标题
    const html = await resolverUtils.request(result.resourceUrl)
    const $ = cheerio.load(html)
    result.channelName = $('title').text().trim() || '未知'

    return result
  }
}