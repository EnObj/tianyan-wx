// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {

  const {
    type = 'month',
    amount = 1
  } = event

  const vipFroms = []
  for (let i = 0; i < amount; i++) {
    const {
      _id
    } = await db.collection('qs_vip_from').add({
      data: {
        type,
        beUsed: false,
        createTime: Date.now()
      }
    })
    vipFroms.push({
      _id,
      type
    })
  }

  return vipFroms
}