const rssUrlResolver = require('../resolver/douyin_user_urlResolver.js')

rssUrlResolver.resolve('https://v.douyin.com/JA7BYds/').then(res=>{
  console.log(res)
})