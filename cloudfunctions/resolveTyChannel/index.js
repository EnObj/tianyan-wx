// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const {
    OPENID
  } = wxContext

  const {
    templateId,
    key, // 传key，则说明来自“具体项目”，否则来自“其他”
    resource
  } = event

  // 来自项目的先查库，有则直接返回
  if (key) {
    // 如果已经存在，直接返回即可
    let {
      data: [channel]
    } = await db.collection('ty_channel').where({
      'channelTemplate._id': templateId,
      key
    }).get()

    if (channel) {
      return {
        channel
      }
    }
  }

  try {
    let resourceUrlResult = resource
    // 动态获取
    if (key) {
      const resolver = require(`./resolver/${templateId}_urlResolver.js`)
      resourceUrlResult = await resolver.resolve(key)
      // 无法获得资源地址
      if (resourceUrlResult.errCode) {
        return resourceUrlResult
      }
    }

    // 模版
    const {
      data: template
    } = await db.collection('ty_channel_template').doc(templateId).get()

    // 创建channel
    const {
      _id: channelId
    } = await db.collection('ty_channel').add({
      data: {
        "channelTemplate": template,
        key,
        attrs: resourceUrlResult.attrs,
        name: resourceUrlResult.channelName,
        resourceUrl: resourceUrlResult.resourceUrl,
        openResourceUrl: resourceUrlResult.openResourceUrl,
        "createBy": OPENID,
        creatorShow: true,
        "createTime": Date.now()
      }
    })
    try {
      // 立马进行一次采集
      await cloud.callFunction({
        name: 'tyChannelListener',
        data: {
          channelQueryWhere: {
            _id: channelId
          }
        }
      })
    } catch (err) {
      console.error(err)
    }
    // 返回channel对象
    return db.collection('ty_channel').doc(channelId).get().then(res => {
      return {
        channel: res.data
      }
    })
  } catch (err) {
    console.log(err)
    return {
      errCode: 500,
      errMsg: '系统错误，请稍后重试'
    }
  }
}