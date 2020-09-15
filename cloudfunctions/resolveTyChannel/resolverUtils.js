const http = require('http')
const https = require('https')
const zlib = require('zlib')

module.exports = {
  request: async function(url, encoding, options = {}, pipe) {
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
  },
  unGzip(gzipData) {
    return new Promise((resolve, reject) => {
      zlib.gunzip(Buffer.from(gzipData, 'binary'), (err, result) => {
        resolve(result.toString())
      })
    })
  }
}