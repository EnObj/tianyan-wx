const resolverUtils = require('../resolverUtils.js')
const cheerio = require('cheerio')

module.exports = {
  resolve: async function(key){
    const result = {}
    // 支持输入资源地址
    if(/^https:\/\/v2ex.com\/t\/(\d+)/.test(key)){
      result.resourceUrl = result.openResourceUrl = key
    } else if(/^\d+$/.test(key)){
      result.resourceUrl = result.openResourceUrl = `https://v2ex.com/t/${key}`
    } else{
      return {
        errCode: 401,
        errMsg: '请重新输入'
      }
    }

    // 得到标题
    const html = await resolverUtils.request(result.resourceUrl)
    const $ = cheerio.load(html)
    const title = $('#Main > div:nth-child(2) > div.header > h1').text().trim()
    if(title){
      result.channelName = title
      return result
    }

    return {
      errCode: 404,
      errMsg: '未发现话题'
    }
  }
}