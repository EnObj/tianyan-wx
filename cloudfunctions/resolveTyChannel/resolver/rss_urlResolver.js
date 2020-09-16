const resolverUtils = require('../resolverUtils.js')
const cheerio = require('cheerio')

module.exports = {
  resolve: async function(key){
    const xml = await resolverUtils.request(key)
    const $ = cheerio.load(xml)

    return {
      channelName: $('feed>title').text().trim(),
      resourceUrl: key,
      openResourceUrl: $('feed>link[type="text/html"]').attr('href') || $('author>uri').first().text().trim()
    }
  }
}