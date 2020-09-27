const resolverUtils = require('../resolverUtils.js')

module.exports = {
  resolve: async function(key){
    const json = await resolverUtils.request(`https://www.ixigua.com/api/searchv2/user/${encodeURIComponent(key)}/0`, 'binary', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-cn',
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip',
        'referer': `https://www.ixigua.com/search/${encodeURIComponent(key)}/`
      }
    }, resolverUtils.unGzip)
    
    // console.log(json)

    const jsonObj = JSON.parse(json)

    if(jsonObj.data.data.length){
      const user = jsonObj.data.data[0].data
      const userName = user.name
      if(userName == key){
        return {
          resourceUrl: `https://www.ixigua.com/home/${user.uid}/`,
          channelName: key,
          openResourceUrl: `https://www.ixigua.com/home/${user.uid}/`
        }
      }else{
        return {
          errCode: 405,
          advices: [userName],
          errMsg: '未发现作者，如果你找的是【' + userName + "】，请输入完整名称重试"
        }
      }
    }

    return {
      errCode: 404,
      errMsg: '未发现作者'
    }
  }
}