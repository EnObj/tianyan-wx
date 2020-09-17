// 云函数入口文件
const cloud = require('wx-server-sdk')
const http = require('http')
const https = require('https')
const cheerio = require('cheerio')
const zlib = require('zlib')
const URL = require('url')
const iconv = require('iconv-lite')

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

  // 一次只处理n个，单个平均分配时长=云函数超时时间/n，其中云函数超时时间可以设置为最大60s
  const {
    data: channels
  } = await query.orderBy('nextListenTime', 'asc').limit(3).get()

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
    const startTime = Date.now()
    const channel = channels[i]
    console.log(`正在处理：${channel.channelTemplate.name}-${channel.name}`)
    try {
      // 请求资源
      const resource = await request(channel.resourceUrl)
      // 属性值解析器
      valueResolver = valueResolvers[channel.resourceType || channel.channelTemplate.resourceType]

      // 将channelData落库
      const data = (channel.attrs || channel.channelTemplate.attrs).reduce((data, attr) => {
         let value = valueResolver(resource, attr.path)
         if(attr.replaceRegExp){
          value = value.replace(new RegExp(attr.replaceRegExp), '')
         }
         data[attr.name] = value
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
    console.log('一个活动采集处理完成，共耗时：' + (Date.now() - startTime))
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

const unGzip = function (gzipData) {
  return new Promise((resolve, reject) => {
    zlib.gunzip(Buffer.from(gzipData, 'binary'), (err, result) => {
      resolve(result)
    })
  })
}

const request = function (url) {
  console.log(url)
  const myURL = new URL.URL(url)
  const proc = url.startsWith('https') ? https : http
  return new Promise((resolve, reject) => {
    const options = {
      ...defaultOptions,
      hostname: myURL.host,
      path: myURL.pathname + myURL.search,
      port: myURL.port,
      method: 'GET'
    }
    // console.log(options)
    proc.get(options, (res) => {
      // console.log(res.headers)
      if(res.statusCode == 302 || res.statusCode == 301){
        return request(res.headers.location).then(docSnap=>{
          resolve(docSnap)
        }, (res)=>{
          reject(res)
        })
      }
      const contentType = res.headers['content-type'].toLowerCase()
      // 非文本类型的直接拒绝处理
      if(!contentType.startsWith('text') && !contentType.startsWith('application/json') && !contentType.startsWith('application/xml') && !contentType.startsWith('application/rss+xml')){
        return reject('sorry, it is not support content-type')
      }
      res.setEncoding('binary')
      var str = "";
      res.on("data", function (chunk) {
        str += chunk; //监听数据响应，拼接数据片段
      })
      const gzip = res.headers["content-encoding"] == 'gzip'
      res.on("end", function () {
        (gzip ? unGzip(str) : Promise.resolve(str)).then(result=>{
          const charset = contentType.split("charset=")[1] || 'utf-8'
          const content = iconv.decode(Buffer.from(result, 'binary'), charset)
          if(contentType.startsWith('text/html')){
            resolveFromHtml(content, charset, result, resolve)
          }else{
            resolve(content)
          }
        })
      })
    })
  })
}

const resolveFromHtml = (html, charset, binResult, resolve)=>{
  var $ = cheerio.load(html)
  var metaCharset = ''
  $('head>meta').each((index, item)=>{
    if(($(item).attr('http-equiv') || '').toLowerCase() == 'content-type'){
      metaCharset = ($(item).attr('content') || '').toLowerCase().split("charset=")[1]
    }
  })
  if(metaCharset && metaCharset != charset){
    console.log(`编码转换${charset} to ${metaCharset}`)
    html = iconv.decode(Buffer.from(binResult, 'binary'), metaCharset)
  }

  resolve(html)
}

const defaultOptions = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Safari/605.1.15',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-cn',
    'Connection': 'keep-alive',
    'Accept-Encoding': 'gzip'
  },
  timeout: 10000, // 10s
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