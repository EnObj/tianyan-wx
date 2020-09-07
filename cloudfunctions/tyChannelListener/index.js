// 云函数入口文件
const cloud = require('wx-server-sdk')
const http = require('http')
const https = require('https')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  // 查询所有channel
  const {
    data: channels
  } = await db.collection('ty_channel').where({}).get()

  // 一个一个channel处理
  channels.forEach(async channel => {
    const resource = await request(channel.resourceUrl)
    valueResolver = valueResolvers[channel.channelTemplate.resourceType]
    // 将channelData落库
    const {
      _id: channelDataId
    } = await db.collection('ty_channel_data').add({
      data: {
        "channel": channel,
        "data": channel.channelTemplate.attrs.reduce((data, attr) => {
          data[attr.name] = valueResolver(resource, attr.path)
          return data
        }, {}),
        "createTime": Date.now()
      }
    })

    const {
      data: channelData
    } = await db.collection('ty_channel_data').doc(channelDataId).get()

    // 获得关注列表
    const {
      data: userChannels
    } = await db.collection('ty_user_channel').where({
      'channel._id': channel._id
    }).get()
    // 生成消息
    userChannels.forEach(async userChannel => {
      await db.collection('ty_user_channel_data_message').add({
        data: {
          _openid: userChannel._openid,
          channelData,
          readed: false,
          notify: userChannel.notify ? 'wait' : 'skip',
          createTime: Date.now(),
          updateTime: Date.now()
        }
      })
    })
  })
}

const valueResolvers = {
  json(jsonResource, path) {
    var resource = JSON.parse(jsonResource)
    const attrs = path.split('.')
    attrs.forEach(attr => {
      resource = resource[attr]
    })
    return resource
  },
  html(htmlResource, path) {

  }
}

function request(url, encoding, options = {}, pipe) {
  console.log(url)
  const proc = url.startsWith('https') ? https : http
  return new Promise((resolve, reject) => {
    proc.get(url, options, function (res) {
      if (encoding) {
        res.setEncoding(encoding)
      }
      var str = "";
      res.on("data", function (chunk) {
        str += chunk; //监听数据响应，拼接数据片段
      })
      res.on("end", function () {
        if (pipe) {
          pipe(str).then(result => {
            resolve(result)
          })
        } else {
          resolve(str)
        }
      })
    })
  })
}