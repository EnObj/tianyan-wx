const urlResolver = require('../resolver/haokan_user_urlResolver.js')

urlResolver.resolve('人民日报').then(res=>{
  console.log(res)
})

urlResolver.resolve('人民').then(res=>{
  console.log(res)
})

urlResolver.resolve('人sldkf').then(res=>{
  console.log(res)
})