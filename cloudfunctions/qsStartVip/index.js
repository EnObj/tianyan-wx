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
    vipFromCode
  } = event


  try {
    // 查询用户信息
    let {
      data: [userProfile]
    } = await db.collection('qs_user_profile').where({
      _openid: openid
    }).get()

    // 开启事务
    const result = await db.runTransaction(async transaction => {
      // 用户信息不存在，马上创建一个
      if (!userProfile) {
        userProfile = {
          _openid: openid,
          createTime: Date.now()
        }
        res = await transaction.collection('qs_user_profile').add({
          data: userProfile
        })
        userProfile._id = res._id
      }

      // 查询激活码
      const {
        data: vipFrom
      } = await transaction.collection('qs_vip_from').doc(vipFromCode).get()

      if (!vipFrom || vipFrom.beUsed) {
        // 使用errCode而不是rollback
        return {
          errMsg: '激活码无效！(您可以通过联系客服获得有效的激活码)',
          errCode: 404
        }
      }

      // 开启vip
      const vipHistory = userProfile.vip || {}
      // 当前开通的时长 + 剩余时长
      const newTimeSize = getTimeSizeByType(vipFrom.type)
      const leftTimeSize = Math.max(((vipHistory.endTime || Date.now()) - Date.now()), 0)
      const endTime = Date.now() + newTimeSize + leftTimeSize
      const vip = {
        "startTime": Date.now(),
        "endTime": endTime,
        "vim_from": vipFrom._id,
        "createTime": vipHistory.createTime || Date.now(),
        "updateTime": Date.now(),
        "vipAge": vipHistory.vipAge || 0 + newTimeSize
      }
      await transaction.collection('qs_user_profile').doc(userProfile._id).update({
        data: {
          vip: db.command.set(vip)
        }
      })

      // 核销
      await transaction.collection('qs_vip_from').doc(vipFromCode).update({
        data: {
          beUsed: true,
          usedTime: Date.now(),
          usedUser: openid
        }
      })

      // 结束
      return {
        errCode: 0,
        errMsg: 'success',
        vip
      }
    })

    return result

  } catch (err) {
    console.error(err)
    return {
      errMsg: '系统错误，请稍后重试',
      errCode: 500
    }
  }
}

function getTimeSizeByType(type) {
  switch (type) {
    case 'day':
      return 1000 * 60 * 60 * 24
    case 'week':
      return 1000 * 60 * 60 * 24 * 7
    case 'month':
      var date = new Date()
      date.setMonth(date.getMonth() + 1)
      return date.getTime() - Date.now()
    case 'half_year':
      var date = new Date()
      date.setMonth(date.getMonth() + 6)
      return date.getTime() - Date.now()
    case 'year':
      var date = new Date()
      date.setFullYear(date.getFullYear() + 1)
      return date.getTime() - Date.now()
    default:
      return 1000
  }
}