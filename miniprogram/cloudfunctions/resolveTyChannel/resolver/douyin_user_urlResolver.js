const puppeteer = require('puppeteer')

module.exports = {
  resolve: async function (key) {

    if (/^https:\/\/v\.douyin\.com\/[A-Za-z0-9]{7}\/?$/.test(key)) {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox']
      })
      const page = await browser.newPage()
      return new Promise(resolve => {
        page.on('response', (response) => {
          // 目标地址
          const url = response.url()
          // console.log(url)
          if (/^https:\/\/www\.iesdouyin\.com\/web\/api\/v2\/user\/info\/\?sec_uid=/.test(url)) {
            response.json().then(async json => {
              browser.close().then(() => {
                resolve({
                  resourceUrl: url,
                  channelName: json.user_info.nickname,
                  openResourceUrl: key
                })
              })
            })
          }
        })
        page.on('load', function () {
          // 保证最久等待10s后必须关闭
          setTimeout(() => {
            console.log('强制关闭浏览器')
            browser.close().then(() => {
              resolve({
                errCode: 404,
                errMsg: '未发现账号'
              })
            })
          }, 5 * 1000)
        })
        page.goto(key)
      })
    }

    return {
      errCode: 401,
      errMsg: '请重新输入'
    }
  }
}