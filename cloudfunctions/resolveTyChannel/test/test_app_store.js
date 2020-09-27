const urlResolver = require('../resolver/app_store_urlResolver.js')

urlResolver.resolve('https://apps.apple.com/cn/app/微信/id414478124#?platform=iphone').then(res=>{
  console.log(res)
})