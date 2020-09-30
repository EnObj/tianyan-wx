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

  const {
    fromUser = 'weixin'
  } = event

  // 查询用户信息
  let {
    data: [userProfile]
  } = await db.collection('ty_user_profile').where({
    _openid: openid
  }).get()

  // 用户记录不存在
  if (!userProfile) {
    userProfile = {
      _openid: openid,
      fromUser,
      channelLimit: 20,
      createTime: Date.now()
    }
    res = await db.collection('ty_user_profile').add({
      data: userProfile
    })
    userProfile._id = res._id

    return {
      userProfile
    }
  }

  // 计算总邀请用户数
  const {
    total: invitedUserCount
  } = await db.collection('ty_user_profile').where({
    fromUser: openid
  }).count()

  // 核算新邀请数
  const newCount = invitedUserCount - (userProfile.invitedUserCount || 0)
  if (newCount) {
    await db.collection('ty_user_profile').doc(userProfile._id).update({
      data: {
        channelLimit: db.command.inc(newCount),
        invitedUserCount
      }
    })
    // 重新查询一遍
    userProfile = (await db.collection('ty_user_profile').doc(userProfile._id).get()).data
  }

  return {
    userProfile
  }
}