// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'dev-gafga'
  // env: 'prod-4tbxs'
})

const db = cloud.database()

// 用于自按照顺序channelTemplate -> channel -> userChannel同步channel结构
exports.main = async (event, context) => {
  
  // 查询得到templates列表
  const {data:templates} = await db.collection('ty_channel_template').where({}).limit(100).get()

  for(let i=0;i<templates.length;i++){
    const template = templates[i]

    console.log(`正在处理：${template.name}`)

    // 更新channel
    const channelRes = await db.collection('ty_channel').where({
      'channelTemplate._id': template._id
    }).update({
      data: {
        channelTemplate: db.command.set(template)
      }
    })

    console.log(`更新channel结果：${channelRes.stats.updated}`)

    // 更新userChannel
    const userChannelRes = await db.collection('ty_user_channel').where({
      'channel.channelTemplate._id': template._id
    }).update({
      data: {
        'channel.channelTemplate': db.command.set(template)
      }
    })

    console.log(`更新userChannel结果：${userChannelRes.stats.updated}`)
  }
}