const resolverUtils = require('../resolverUtils.js')
const cheerio = require('cheerio')

module.exports = {
  resolve: async function(key){
    const result = {}
    // 支持输入资源地址
    if(/^https?:\/\/www\.zhihu\.com\/question\/(\d+)/.test(key)){
      result.resourceUrl = result.openResourceUrl = `https://www.zhihu.com/question/${RegExp.$1}`
    }else if(/^\d+$/.test(key)){
      result.resourceUrl = result.openResourceUrl = `https://www.zhihu.com/question/${key}`
    } else{
      return {
        errCode: 401,
        errMsg: '请重新输入'
      }
    }

    // 得到标题
    const html = await resolverUtils.request(result.resourceUrl)
    const $ = cheerio.load(html)
    const title = $('h1.QuestionHeader-title').text().trim()
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