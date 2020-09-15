// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  console.log(event)

  const {channelId, updateData} = event

  const res = await db.collection('ty_channel').where({
    _id: channelId,
    createBy: wxContext.OPENID
  }).update({
    data: updateData
  })

  if(res.stats.updated){
    return {}
  }

  return {
    errCode: 403,
    errMsg: '活动不存在或权限不足'
  }
}