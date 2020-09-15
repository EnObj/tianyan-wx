const resolverUtils = require('../resolverUtils.js')
const cheerio = require('cheerio')

module.exports = {
  resolve: async function (key) {
    // 支持输入资源地址
    if (/^https:\/\/www\.jianshu\.com\/u\/([a-f0-9]+)/.test(key)) {
      const authorHomePage = `https://www.jianshu.com/u/${RegExp.$1}`
      const html = await resolverUtils.request(authorHomePage)
      // console.log(html)
      const $ = cheerio.load(html)
      const authorName = $('body > div.container.person > div > div.col-xs-16.main > div.main-top > div.title > a').text().trim()
      return {
        resourceUrl: authorHomePage,
        openResourceUrl: authorHomePage,
        channelName: authorName || '未知作者'
      }
    }
    return {
      errCode: 404,
      errMsg: '未发现作者'
    }
  }
}