const resolverUtils = require('../resolverUtils.js')
const cheerio = require('cheerio')

module.exports = {
  resolve: async function(key){
    const result = {}
    // 支持输入资源地址
    if(/^https:\/\/item\.m\.jd\.com\/product\/(\d+)\.html/.test(key) || /^https:\/\/item\.jd\.com\/(\d+)\.html/.test(key)){
      result.resourceUrl = result.openResourceUrl = `https://item.m.jd.com/product/${RegExp.$1}.html`
    } else if(/^\d+$/.test(key)){
      result.resourceUrl = result.openResourceUrl = `https://item.m.jd.com/product/${key}.html`
    } else{
      return {
        errCode: 401,
        errMsg: '请重新输入'
      }
    }

    // 得到标题
    const html = await resolverUtils.request(result.resourceUrl)
    const $ = cheerio.load(html)
    const title = $('#itemName').text().trim()
    if(title){
      result.channelName = title
      return result
    }

    return {
      errCode: 404,
      errMsg: '未发现商品'
    }
  }
}