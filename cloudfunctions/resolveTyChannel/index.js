// 云函数入口文件
const cloud = require('wx-server-sdk')
const http = require('http')
const https = require('https')
const zlib = require('zlib')
const cheerio = require('cheerio');

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
    resource,
    attrs
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
      resourceUrlResult = await resourceUrlResolverMap[templateId](key)
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
        attrs,
        name: resourceUrlResult.channelName,
        resourceUrl: resourceUrlResult.resourceUrl,
        openResourceUrl: resourceUrlResult.openResourceUrl,
        "createBy": OPENID,
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

const resourceUrlResolverMap = {
  'bili_uper': async function (key) {
    const html = await request(`https://search.bilibili.com/upuser?keyword=${encodeURIComponent(key)}`, 'binary', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-cn',
        'Connection': 'keep-alive',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    }, unGzip)
    const $ = cheerio.load(html)
    const upers = $('#user-list > div.flow-loader.user-wrap > ul > li')
    if (upers.length) {
      const uperNameEle = upers.first().find('div.info-wrap > div.headline > a.title')
      const uperName = uperNameEle.text().trim()
      if (uperName == key) {
        const userId = uperNameEle.attr('href').match(/bilibili\.com\/(\d+)\?from/)[1]
        return {
          resourceUrl: `https://api.bilibili.com/x/space/arc/search?mid=${userId}&ps=30&tid=0&pn=1&keyword=&order=pubdate&jsonp=jsonp`,
          channelName: key,
          openResourceUrl: `https://space.bilibili.com/${userId}`
        }
      }
      return {
        errCode: 405,
        advices: [uperName],
        errMsg: '未发现up主，如果你找的是【' + uperName + "】，请输入完整名称重试"
      }
    }
    return {
      errCode: 404,
      errMsg: '未发现up主'
    }
  },
  'v2ex_post': async function (key) {
    // 支持输入资源地址
    if(/^https:\/\/v2ex.com\/t\/(\d+)/.test(key)){
      return {
        channelName: '话题' + RegExp.$1,
        resourceUrl: key,
        openResourceUrl: key
      }
    }
    return {
      channelName: '话题' + key,
      resourceUrl: `https://v2ex.com/t/${key}`,
      openResourceUrl: `https://v2ex.com/t/${key}`
    }
  },
  'weibo_user': async function(key){
    const json = await request(`https://m.weibo.cn/api/container/getIndex?containerid=${encodeURIComponent('100103type%3D3%26q%3D'+key+'%26t%3D0')}&page_type=searchall`)

    // console.log(json)
    const jsonObj = JSON.parse(json)
    const user = jsonObj.data.cards[1].card_group[0].user
    if(user.screen_name == key){
      const userId = user.id
      const containerJson = await request(`https://m.weibo.cn/api/container/getIndex?type=uid&value=${userId}`)
      const containerJsonObj = JSON.parse(containerJson)
      const containerid = containerJsonObj.data.tabsInfo.tabs[1].containerid
      return {
        resourceUrl: `https://m.weibo.cn/api/container/getIndex?type=uid&value=${userId}&containerid=${containerid}`,
        channelName: key,
        openResourceUrl: `https://m.weibo.cn/u/${userId}`
      }
    }

    return{
      errCode: 404,
      errMsg: '未找到博主'
    }
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

function unGzip(gzipData) {
  return new Promise((resolve, reject) => {
    zlib.gunzip(Buffer.from(gzipData, 'binary'), (err, result) => {
      resolve(result.toString())
    })
  })
}