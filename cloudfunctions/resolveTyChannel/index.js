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
    key
  } = event

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

  // 否则需要根据规则动态获取
  const {
    data: template
  } = await db.collection('ty_channel_template').doc(templateId).get()

  return request(`https://search.bilibili.com/upuser?keyword=${key}`, 'binary', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Safari/605.1.15',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-cn',
      'Connection': 'keep-alive',
      'Accept-Encoding': 'gzip, deflate, br'
    }
  }, unGzip).then(html => {
    // console.log(html)
    const $ = cheerio.load(html)
    const uperUrl = $('#user-list > div.flow-loader.user-wrap > ul > li:nth-child(1) > div.up-face > a').attr('href')
    if (uperUrl) {
      const userId = uperUrl.match(/bilibili\.com\/(\d+)\?from/)[1]
      return db.collection('ty_channel').add({
        data: {
          "channelTemplate": template,
          key,
          "resourceUrl": `https://api.bilibili.com/x/space/arc/search?mid=${userId}&ps=30&tid=0&pn=1&keyword=&order=pubdate&jsonp=jsonp`,
          "createBy": OPENID,
          "createTime": Date.now()
        }
      }).then(res => {
        return db.collection('ty_channel').doc(res._id).get().then(res => {
          return {
            channel: res.data
          }
        })
      })
    }
    return {
      errCode: 404,
      errMeg: '未能发现up主'
    }
  })
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