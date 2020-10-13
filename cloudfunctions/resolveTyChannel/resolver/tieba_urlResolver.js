const resolverUtils = require('../resolverUtils.js')

module.exports = {
  resolve: async function(key){
    key = key.replace(/吧$/, '')

    const json = await resolverUtils.request(`https://tieba.baidu.com/suggestion?query=${encodeURIComponent(key)}&ie=utf-8`)
    
    // console.log(json)

    const jsonObj = JSON.parse(json)

    if(jsonObj.error == 0 && jsonObj.query_match.search_data){
      const tieba = jsonObj.query_match.search_data[0]
      if(tieba.fname == key){
        return {
          resourceUrl: `https://tieba.baidu.com/f?ie=utf-8&kw=${encodeURIComponent(key)}`,
          channelName: key + '吧',
          openResourceUrl: `https://tieba.baidu.com/f?ie=utf-8&kw=${encodeURIComponent(key)}`
        }
      }else{
        return {
          errCode: 405,
          advices: jsonObj.query_match.search_data.map(maybe=>{
            return maybe.fname + '吧'
          }).slice(0, 6),
          errMsg: '未发现贴吧，如果你找的是【' + tieba.fname + "吧】，请输入完整名称重试"
        }
      }
    }

    return {
      errCode: 404,
      errMsg: '未发现贴吧'
    }
  }
}