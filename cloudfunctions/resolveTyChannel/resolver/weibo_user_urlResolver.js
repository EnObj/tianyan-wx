const resolverUtils = require('../resolverUtils.js')

module.exports = {
  resolve: async function(key){
    const json = await resolverUtils.request(`https://m.weibo.cn/api/container/getIndex?containerid=${encodeURIComponent('100103type%3D3%26q%3D'+key+'%26t%3D0')}&page_type=searchall`)

    // console.log(json)
    const jsonObj = JSON.parse(json)
    try{
      const user = jsonObj.data.cards[1].card_group[0].user
      if(user.screen_name == key){
        const userId = user.id
        const containerJson = await resolverUtils.request(`https://m.weibo.cn/api/container/getIndex?type=uid&value=${userId}`)
        const containerJsonObj = JSON.parse(containerJson)
        const containerid = containerJsonObj.data.tabsInfo.tabs[1].containerid
        return {
          resourceUrl: `https://m.weibo.cn/api/container/getIndex?type=uid&value=${userId}&containerid=${containerid}`,
          channelName: key,
          openResourceUrl: `https://m.weibo.cn/u/${userId}`
        }
      }
      return {
        errCode: 405,
        advices: [user.screen_name],
        errMsg: '未发现博主，如果你找的是【' + user.screen_name + "】，请输入完整名称重试"
      }
    }catch(err){
      console.error(err)
    }

    return{
      errCode: 404,
      errMsg: '未找到博主'
    }
  }
}