const urlResolver = require('../resolver/jianshu_author_urlResolver.js')

urlResolver.resolve('柠檬精的故事会').then(res=>{
  console.log(res)
})

urlResolver.resolve('柠檬精的').then(res=>{
  console.log(res)
})

urlResolver.resolve('阿打开房间浓缩咖啡').then(res=>{
  console.log(res)
})