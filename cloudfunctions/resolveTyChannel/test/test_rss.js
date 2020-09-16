const rssUrlResolver = require('./../resolver/rss_urlResolver.js')

rssUrlResolver.resolve('http://www.ruanyifeng.com/blog/atom.xml').then(res=>{
  console.log(res)
})

rssUrlResolver.resolve('http://feed.cnblogs.com/blog/u/630638/rss/').then(res=>{
  console.log(res)
})