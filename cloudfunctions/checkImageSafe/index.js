// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event)

  const fileID = event.imageFileId

  const extName = fileID.substr(fileID.lastIndexOf('.') + 1)

  const res = await cloud.downloadFile({
    fileID
  })

  try {
    const result = await cloud.openapi.security.imgSecCheck({
      media: {
        contentType: 'image/' + extName,
        value: res.fileContent
      }
    })
    console.log(result)

    return result

  } catch (err) {
    console.log(err)
    return err
  }
}