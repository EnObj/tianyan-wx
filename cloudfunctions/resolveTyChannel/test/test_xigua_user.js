const urlResolver = require('../resolver/xigua_user_urlResolver.js')

urlResolver.resolve('用青春去旅行').then(res=>{
  console.log(res)
})

urlResolver.resolve('用青春').then(res=>{
  console.log(res)
})

urlResolver.resolve('daen').then(res=>{
  console.log(res)
})