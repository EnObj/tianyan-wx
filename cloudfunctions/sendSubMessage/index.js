// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const {OPENID} = wxContext

  const {data, templateId} = event

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: OPENID,
      page: '/pages/example/index',
      data,
      templateId
    })
    return {
      result
    }
  } catch (err) {
    console.error(err)
    return {
      errCode: 500,
      errMsg: '系统异常，请稍后重试',
      err: err
    }
  }
}