const cheerio = require('cheerio')

module.exports = {
  restore: async function(resource){
    const $ = cheerio.load(resource)
    return $("code.pagelet_html[id='pagelet_html_forum/pagelet/forum_card_number']").contents()[0].data
  }
}