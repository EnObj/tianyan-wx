const puppeteer = require('puppeteer')

module.exports = {
  resolve: async function (key) {
    
    // 不处理链接
    if(/https?:\/\//.test(key)){
      return {
        errCode: 401,
        errMsg: '请重新输入'
      }
    }

    const browser = await puppeteer.launch({
      args: ['--no-sandbox']
    })
    const page = await browser.newPage()
    return new Promise(resolve => {
      page.on('response', (response) => {
        // 目标地址
        const url = response.url()
        // console.log(url)
        if (/^https:\/\/www\.jianshu\.com\/search\/do\?q=/.test(url)) {
          response.json().then(async json => {
            browser.close().then(() => {
              const user = json.entries[0]
              // console.log(user)
              if(user){
                if(user.nickname == key){
                  resolve({
                    resourceUrl: `https://www.jianshu.com/u/${user.slug}`,
                    channelName: key,
                    openResourceUrl: `https://www.jianshu.com/u/${user.slug}`
                  })
                }else{
                  resolve({
                    errCode: 405,
                    advices: [user.nickname],
                    errMsg: '未发现作者，如果你找的是【' + user.nickname + "】，请输入完整名称重试"
                  })
                }
              }else{
                resolve({
                  errCode: 404,
                  errMsg: '未发现作者'
                })
              }
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
              errMsg: '未发现作者'
            })
          })
        }, 5 * 1000)
      })
      page.goto(`https://www.jianshu.com/search?q=${encodeURIComponent(key)}&page=1&type=user`)
    })
  }
}