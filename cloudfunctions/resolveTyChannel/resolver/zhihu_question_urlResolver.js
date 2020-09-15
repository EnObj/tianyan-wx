const resolverUtils = require('../resolverUtils.js')
const cheerio = require('cheerio')

module.exports = {
  resolve: async function(key){
    let result = {
      resourceUrl: `https://www.zhihu.com/question/${key}`,
      openResourceUrl: `https://www.zhihu.com/question/${key}`
    }
    // 支持输入资源地址
    if(/^https?:\/\/www\.zhihu\.com\/question\/(\d+)/.test(key)){
      result.resourceUrl = result.openResourceUrl = `https://www.zhihu.com/question/${RegExp.$1}`
    }

    // 得到标题
    const html = await resolverUtils.request(result.resourceUrl)
    const $ = cheerio.load(html)
    result.channelName = $('title').text().trim() || '未知'

    return result
  }
}