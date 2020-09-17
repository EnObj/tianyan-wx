const resolverUtils = require('../resolverUtils.js')
const cheerio = require('cheerio')

module.exports = {
  resolve: async function(key){
    const xml = await resolverUtils.request(key)
    const $ = cheerio.load(xml)

    // 判断是否是2.0的标准
    if($("rss").attr('version') == '2.0'){
      return {
        channelName: $('rss>channel>title').text().trim(),
        resourceUrl: key,
        attrs: [{
          name: '首篇标题',
          path: 'rss>channel>item:nth-of-type(1)>title'
        }],
      }
    }

    return {
      channelName: $('feed>title').text().trim(),
      resourceUrl: key,
    }
  }
}