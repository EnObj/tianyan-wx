// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const $ = db.command.aggregate

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const where = {
    notify: 'wait'
  }
  while ((await db.collection('ty_user_channel_data_message').where(where).count()).total) {

    // 通过用户进行聚合
    const {
      list: userMessages
    } = await db.collection('ty_user_channel_data_message').aggregate().match(where).group({
      _id: '$_openid',
      channelDatas: $.addToSet('$channelData')
    }).end()

    console.log(userMessages)

    // 一个一个处理
    for (let i = 0; i < userMessages.length; i++) {

      const userMessage = userMessages[i]
      console.log(`正在处理：${userMessage._id}`)

      // 具名渠道代表
      const channel = userMessage.channelDatas[0].channel
      let notifyResult = 'finished'
      try {
        // 发消息
        await cloud.openapi.subscribeMessage.send({
          touser: userMessage._id,
          page: '/pages/index/index',
          data: {
            thing1: {
              value: channel.name + (userMessage.channelDatas.length > 1 ? ("等" + userMessage.channelDatas.length + "个活动") : "")
            },
            phrase2: {
              value: '有更新'
            }
          },
          templateId: '-uC7MFgpZqLROkVO_QILbH23d85gg-ErEM0KavcKP6A'
        })
        // 记录状态
      } catch (err) {
        console.error(err)
        notifyResult = 'fail'
      } finally {
        // 更新状态
        await db.collection('ty_user_channel_data_message').where({
          _openid: userMessage._id,
          ...where
        }).update({
          data: {
            notify: notifyResult,
            notifyTime: Date.now()
          }
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
}