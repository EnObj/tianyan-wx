// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 通过用户进行聚合
  const {
    data: messages
  } = await db.collection('ty_user_channel_data_message').where({
    notify: 'wait'
  }).get()

  // 一个一个处理
  messages.forEach(async message => {
    // 发消息
    await cloud.openapi.subscribeMessage.send({
      touser: message._openid,
      page: '/pages/index/index',
      data: {
        thing1: {
          value: '某渠道'
        },
        phrase2: {
          value: '有更新'
        }
      },
      templateId: '-uC7MFgpZqLROkVO_QILbH23d85gg-ErEM0KavcKP6A'
    })
    // 更新状态
    await db.collection('ty_user_channel_data_message').doc(message._id).update({
      data: {
        notify: 'finished'
      }
    })
  })
}