// 云函数入口文件
const cloud = require('wx-server-sdk')
const http = require('http')
const https = require('https')
const cheerio = require('cheerio')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const {
    channelQueryWhere = {}
  } = event

  // 构造查询条件
  const query = db.collection('ty_channel').where(db.command.and({
    ...channelQueryWhere,
    disabled: db.command.exists(false),
  }, db.command.or({
    nextListenTime: db.command.exists(false)
  }, {
    nextListenTime: db.command.lte(Date.now())
  })))

  // 打印一下活动数目
  const {
    total: channelsCount
  } = await query.count()
  console.log(`满足条件的活动数目：${channelsCount}`)

  // 一次只最多处理6个
  const {
    data: channels
  } = await query.orderBy('nextListenTime', 'asc').limit(6).get()

  // 先打标记，防止并发
  const myChannels = []
  for(let i = 0; i < channels.length; i++){
    const channel = channels[i]
    const {stats: {updated}} = await db.collection('ty_channel').where({
      _id: channel._id,
      nextListenTime: channel.nextListenTime
    }).update({
      data: {
        // 默认沉默15分钟
        nextListenTime: Date.now() + (channel.minTimeSpace || channel.channelTemplate.minTimeSpace || 15 * 60 * 1000)
      }
    })
    if(updated){
      myChannels.push(channel)
    }else{
      console.log(`发生并发操作，跳过此活动处理：${channel._id}`)
    }
  }

  console.log(`实际处理活动数量：${myChannels.length}`)

  // 一个一个channel处理（此处不能使用forEach）
  for (let i = 0; i < myChannels.length; i++) {
    const channel = channels[i]
    console.log(`正在处理：${channel.channelTemplate.name}-${channel.name}`)
    try {
      // 请求资源
      const resource = await request(channel.resourceUrl)
      // 属性值解析器
      valueResolver = valueResolvers[channel.resourceType || channel.channelTemplate.resourceType]

      // 将channelData落库
      const data = (channel.attrs || channel.channelTemplate.attrs).reduce((data, attr) => {
        data[attr.name] = valueResolver(resource, attr.path)
        return data
      }, {})
      // 获得库里上次的数据（用于比对是否有更新）
      const {
        data: [lastChannelData]
      } = await db.collection('ty_channel_data').where({
        'channel._id': channel._id
      }).orderBy('createTime', 'desc').limit(1).get()
      const dataChanged = !lastChannelData || !isObjectValueEqual(lastChannelData.data, data)

      if (dataChanged) {
        console.log('有更新', data)
        // 生成channelData
        const {
          _id: channelDataId
        } = await db.collection('ty_channel_data').add({
          data: {
            "channel": channel,
            data,
            dataChanged,
            "createTime": Date.now()
          }
        })

        // 生成消息
        await genMessage(channelDataId)
      }
    } catch (err) {
      console.error(err)
      // 除名
      await db.collection('ty_channel').doc(channel._id).update({
        data: {
          disabled: true
        }
      })
    }
  }

  // 统计一下当前禁用数据
  const {
    total: disabledCount
  } = await db.collection('ty_channel').where({
    disabled: true
  }).count()

  console.log(`当前禁用活动数目：${disabledCount}`)
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
    const $ = cheerio.load(htmlResource)
    return $(path).text().trim()
  }
}

async function genMessage(channelDataId) {
  const {
    data: channelData
  } = await db.collection('ty_channel_data').doc(channelDataId).get()

  // 分页批处理
  const query = db.collection('ty_user_channel').where({
    'channel._id': channelData.channel._id
  })

  const {total: amount} = await query.count()
  console.log(`预计生成消息数量：${amount}`)

  let counter = 0
  while(true){

    // 获得关注列表
    const {
      data: userChannels
    } = await query.skip(counter).limit(100).get()

    if(!userChannels.length){
      break
    }

    console.log(`用户消息生成进度：${counter} + ${userChannels.length}`)
    counter += userChannels.length
  
    // 生成消息（此处进行比对数据是否有更新）
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
  }

  console.log(`完成，生成消息数量：${counter}`)
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

// 对比两个对象的值是否完全相等 返回值 true/false
function isObjectValueEqual(a, b) {
  //取对象a和b的属性名
  var aProps = Object.getOwnPropertyNames(a);
  var bProps = Object.getOwnPropertyNames(b);
  //判断属性名的length是否一致
  if (aProps.length != bProps.length) {
    return false;
  }
  //循环取出属性名，再判断属性值是否一致
  for (var i = 0; i < aProps.length; i++) {
    var propName = aProps[i];
    if (a[propName] !== b[propName]) {
      return false;
    }
  }
  return true;
}