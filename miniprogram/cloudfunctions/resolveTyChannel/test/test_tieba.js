const urlResolver = require('../resolver/tieba_urlResolver.js')

urlResolver.resolve('汪峰').then(res=>{
  console.log(res)
})

urlResolver.resolve('另').then(res=>{
  console.log(res)
})

urlResolver.resolve('另类吧').then(res=>{
  console.log(res)
})