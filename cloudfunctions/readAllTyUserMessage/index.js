// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  return db.collection('ty_user_channel_data_message').where({
    _openid: openid,
    readed: false
  }).update({
    data: {
      readed: true
    }
  })
}