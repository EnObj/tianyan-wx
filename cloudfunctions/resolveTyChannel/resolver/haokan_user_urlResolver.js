const resolverUtils = require('../resolverUtils.js')

module.exports = {
  resolve: async function(key){
    const json = await resolverUtils.request(`https://haokan.baidu.com/videoui/page/search?pn=1&rn=10&_format=json&tab=user&query=${encodeURIComponent(key)}`)
    
    // console.log(json)

    const jsonObj = JSON.parse(json)

    if(jsonObj.data.response.list.length){
      const user = jsonObj.data.response.list[0]
      const userName = new String(user.name)
      if(userName == key){
        return {
          resourceUrl: `https://haokan.baidu.com/author/${user.appid}`,
          channelName: key,
          openResourceUrl: `https://haokan.baidu.com/author/${user.appid}`
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