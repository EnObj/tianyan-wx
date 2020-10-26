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
  // env: 'rb-dev-vv1ri'
})

// 云函数入口函数
exports.main = async (event, context) => {
  var {
    url
  } = event

  console.log(url)

  if (!/^https?:\/\/.+/.test(url)) {
    if(/^((.+)\.)+.+(?:(?:\/)|$)/.test(url)){
      url = 'http://' + url
    }else{
      return {
        errCode: 400,
        errMsg: '请求参数不合法'
      }
    }
  }

  // 否则从网络拉取
  return request(url).then(docSnap=>{

    // TODO 缓存list中的图片
    const document = {
      contentType: 'html',
      list: [],
      ...docSnap,
      url: url,
      createTime: Date.now()
    }

    // resolve 相对地址
    document.list.forEach((item, index)=>{
      if(['img', 'video'].includes(item.type)){
        item.content = URL.resolve(url, item.content)
      }
      if(item.ref){
        item.ref = URL.resolve(url, item.ref)
      }
      item.insideId = 'e' + index
    })
  
    return {
      document
    }
  })

}

// 解析并递归子节点，输出图文
const workOnEle = function ($, ele, list, seletor, ref) {
  // console.log(ele)
  const current = $(ele)
  if(['script','style'].includes(ele.tagName)){
    return
  }
  if(['img', 'video'].includes(ele.tagName)){
    // console.log(current)
    const src = current.attr('src') || current.attr('data-src')
    if(src){
      list.push({
        type: ele.tagName,
        content: src,
        selector: seletor,
        insideId: 'e' + (list.length + 1)
      })
    }
    return
  }
  if(ele.tagName == 'a'){
    // console.log(current)
    ref = current.attr('href')
  }
  let tagIndex = 0
  current.contents().each((index, child) => {
    // console.log(child)
    switch (child.nodeType) {
      case 1:
        tagIndex++
        const childSeletor = seletor + '>' + child.tagName + ':nth-child(' + tagIndex + ')'
        const startDiv = {
          type: 'div',
          selector: childSeletor,
          insideId: 'e' + (list.length + 1)
        }
        const startDivIndex = list.length
        list.push(startDiv)
        workOnEle($, child, list, childSeletor, ref)
        // 判断多层嵌套
        if (list[list.length - 1] == startDiv) {
          list.splice(list.length - 1, 1)
        } else if (list[startDivIndex + 1] == list[list.length - 1] || list[startDivIndex + 1].type == 'div' && list[startDivIndex + 1].selector == list[list.length - 1].selector) {
          list.splice(startDivIndex, 1)
        } else {
          list.push({
            type: '/div',
            selector: childSeletor,
            insideId: 'e' + (list.length + 1)
          })
        }
        break;
      case 3:
        const text = child.data.trim()
        if (text) {
          list.push({
            type: 'text',
            content: text,
            selector: seletor,
            ref: ref,
            insideId: 'e' + (list.length + 1)
          })
        }
        break;
    }
  })
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
    console.log(options)
    proc.get(options, (res) => {
      console.log(res.headers)
      if(res.statusCode == 302 || res.statusCode == 301){
        return request(URL.resolve(url, res.headers.location)).then(docSnap=>{
          resolve(docSnap)
        }, (res)=>{
          reject(res)
        })
      }
      const contentType = res.headers['content-type'].toLowerCase()
      if(contentType.startsWith('video')){
        return resolve({
          list: [{
            type: 'video',
            content: url
          }],
          title: '视频'
        })
      }
      if(contentType.startsWith('image')){
        return resolve({
          list: [{
            type: 'img',
            content: url
          }],
          title: '图片'
        })
      }
      // 非文本类型的直接拒绝处理
      if(!contentType.startsWith('text') && !contentType.startsWith('application/json')){
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
            resolveFromHtml(content, charset, result,  resolve, url)
          }else if(contentType.startsWith('application/json')){
            resolve({
              json: JSON.parse(content),
              contentType: 'json',
              title: url.substr(url.lastIndexOf('/') + 1)
            })
          }else{
            resolve({
              list: [{
                type: 'text',
                content: content
              }],
              title: url.substr(url.lastIndexOf('/') + 1)
            })
          }
        })
      })
    })
  })
}

const resolveFromHtml = (html, charset, binResult, resolve, url)=>{
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
    $ = cheerio.load(html)
  }

  const list = []
  workOnEle($, $('body').get(0), list, 'html>body')

  resolve({
    list: list,
    title: $('title').text().trim()
  })
}

const defaultOptions = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Safari/605.1.15',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-cn',
    'Connection': 'keep-alive',
    'Accept-Encoding': 'gzip'
  }
}