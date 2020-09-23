const resolverUtils = require('../resolverUtils.js')
const cheerio = require('cheerio')

module.exports = {
  resolve: async function(key){
    const json = await resolverUtils.request(`https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?is_xml=0&key=${encodeURIComponent(key)}&g_tk_new_20200303=5381&g_tk=5381&jsonpCallback=SmartboxKeysCallbackmod_search2580&loginUin=0&hostUin=0&format=jsonp&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`)
    
    // console.log(json)

    const jsonObj = JSON.parse(json.replace('SmartboxKeysCallbackmod_search2580(', '').replace(/\)\s*$/, ''))

    if(jsonObj.data.singer.count){
      const singer = jsonObj.data.singer.itemlist[0]
      if(singer.name == key){
        return {
          resourceUrl: `https://y.qq.com/n/yqq/singer/${singer.mid}.html`,
          channelName: key,
          openResourceUrl: `https://y.qq.com/n/yqq/singer/${singer.mid}.html`
        }
      }else{
        return {
          errCode: 405,
          advices: [singer.name],
          errMsg: '未发现歌手，如果你找的是【' + singer.name + "】，请输入完整名称重试"
        }
      }
    }

    return {
      errCode: 404,
      errMsg: '未发现歌手'
    }
  }
}