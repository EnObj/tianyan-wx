// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database({
  throwOnNotFound: false,
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const {
    fromUser = 'weixin'
  } = event

  // 开启事务处理
  const userProfile = await db.runTransaction(async transaction => {

    // 查询用户信息
    let {
      data: userProfile
    } = await transaction.collection('ty_user_profile').doc(openid).get()
  
    // 用户记录不存在，创建用户
    if (!userProfile) {
      userProfile = {
        _id: openid,
        _openid: openid,
        fromUser,
        channelLimit: 20,
        invitedUserCount: 0,
        createTime: Date.now()
      }
      await transaction.collection('ty_user_profile').add({
        data: userProfile
      })

      if(fromUser){
        console.log(`thanks fromUser: ${fromUser}`)
  
        // 感谢fromUser
        await transaction.collection('ty_user_profile').doc(fromUser).update({
          data: {
            channelLimit: db.command.inc(1),
            invitedUserCount: db.command.inc(1)
          }
        })
      }
    }

    return userProfile
  })

  return {
    userProfile
  }
}