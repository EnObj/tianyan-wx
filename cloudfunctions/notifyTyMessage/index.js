// 云函数入口文件
const cloud = require('wx-server-sdk')
const notifyTemplateId = 'NW6QfOU9WUBKxXaCqHatxASKZwLk2IX9jjnU7ZzGI3k'

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const $ = db.command.aggregate

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const where = {
    notify: 'wait',
    readed: false
  }
  const {
    total: amount
  } = await db.collection('ty_user_channel_data_message').where(where).count()
  console.log(`待处理数目：${amount}`)

  // 通过用户进行聚合
  const {
    list: userMessages
  } = await db.collection('ty_user_channel_data_message').aggregate().match(where).group({
    _id: '$_openid',
    channelDatas: $.addToSet('$channelData')
  }).limit(50).end()

  // 一个一个处理
  for (let i = 0; i < userMessages.length; i++) {

    const userMessage = userMessages[i]
    console.log(`正在处理：${userMessage._id}`)

    // 具名渠道代表
    const channel = userMessage.channelDatas[0].channel
    const notifyUpdater = {
      notify: 'finished',
      notifyTime: Date.now()
    }
    try {
      console.log(`正在发送：${channel._id}`)
      // 发消息
      await cloud.openapi.subscribeMessage.send({
        touser: userMessage._id,
        page: '/pages/index/index',
        data: {
          name1: {
            value: channel.name.substr(0, 10)
          },
          thing7: {
            value: (userMessage.channelDatas.length > 1 ? ("等" + userMessage.channelDatas.length + "个活动") : "") + '有更新'
          }
        },
        templateId: notifyTemplateId
      })
      // 记录状态
    } catch (err) {
      console.error(err)
      notifyUpdater.notifyResult = 'fail'
    } finally {
      // 更新状态
      await db.collection('ty_user_channel_data_message').where({
        _openid: userMessage._id,
        ...where
      }).update({
        data: notifyUpdater
      })
    }

    // 把代表渠道的订阅标记关了
    await db.collection('ty_user_channel').where({
      _openid: userMessage._id,
      'channel._id': channel._id
    }).update({
      data: {
        notify: false
      }
    })
  }
}