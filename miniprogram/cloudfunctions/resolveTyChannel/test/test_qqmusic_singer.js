const rssUrlResolver = require('../resolver/qqmusic_singer_urlResolver.js')

rssUrlResolver.resolve('五条人').then(res=>{
  console.log(res)
})