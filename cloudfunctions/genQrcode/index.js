// 云函数入口文件
const cloud = require('wx-server-sdk')
const qrcode = require('qrcode')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const {content} = event

  return new Promise((resolve, reject)=>{
    qrcode.toBuffer(content || '场宁Office', function (err, buffer) {
      if(err){
        console.error(err)
        reject(err)
      }else{
        console.log(buffer)
        resolve(buffer)
      }
    })
  }).then(buffer=>{
    return cloud.uploadFile({
      fileContent: buffer,
      cloudPath: `qrcode/${getStr8Date()}/${getRandomFileName('qrcode.png')}`
    }).then(res=>{
      return res.fileID
    })
  })
}

function getStr8Date() {
  const date = new Date()
  return '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate()
}

function getRandomFileName(from){
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}${from.substr(from.lastIndexOf('.'))}`
}