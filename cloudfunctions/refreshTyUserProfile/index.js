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

  console.log('openid', openid)

  const { fromUser } = event

  // 查询用户信息
  let {
    data: userProfile
  } = await db.collection('ty_user_profile').doc(openid).get()

  // 用户记录不存在，创建用户（因为_id=openid，所以不必担心因并发而重复创建同一个用户，因此此处无需再开启事务）
  if (!userProfile) {
    console.log('创建新用户')
    userProfile = {
      _id: openid,
      _openid: openid,
      fromUser: fromUser || 'self',
      channelLimit: 20,
      invitedUserCount: 0,
      createTime: Date.now()
    }
    await db.collection('ty_user_profile').add({
      data: userProfile
    })

    if (fromUser && fromUser != openid) {
      console.log(`thanks fromUser: ${fromUser}`)

      // 感谢fromUser
      await db.collection('ty_user_profile').doc(fromUser).update({
        data: {
          channelLimit: db.command.inc(1),
          invitedUserCount: db.command.inc(1)
        }
      })
    }
  }

  return {
    userProfile
  }
}