const resolverUtils = require('../resolverUtils.js')
const cheerio = require('cheerio')

module.exports = {
  resolve: async function(key){
    const html = await resolverUtils.request(`https://search.bilibili.com/upuser?keyword=${encodeURIComponent(key)}`, 'binary', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-cn',
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    }, resolverUtils.unGzip)
    const $ = cheerio.load(html)
    const upers = $('#user-list > div.flow-loader.user-wrap > ul > li')
    if (upers.length) {
      const uperNameEle = upers.first().find('div.info-wrap > div.headline > a.title')
      const uperName = uperNameEle.text().trim()
      if (uperName == key) {
        const userId = uperNameEle.attr('href').match(/bilibili\.com\/(\d+)\?from/)[1]
        return {
          resourceUrl: `https://api.bilibili.com/x/space/arc/search?mid=${userId}&ps=30&tid=0&pn=1&keyword=&order=pubdate&jsonp=jsonp`,
          channelName: key,
          openResourceUrl: `https://space.bilibili.com/${userId}`
        }
      }
      return {
        errCode: 405,
        advices: [uperName],
        errMsg: '未发现up主，如果你找的是【' + uperName + "】，请输入完整名称重试"
      }
    }
    return {
      errCode: 404,
      errMsg: '未发现up主'
    }
  }
}