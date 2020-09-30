const userProfileUtils = require('./utils/userProfileUtils.js')

//app.js
App({
  onLaunch: function (options) {

    // 设置到缓存，供新建用户时读取
    console.log(JSON.stringify(options))
    wx.setStorageSync('fromUser', options.query.fromUser)

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'prod-4tbxs',
        traceUser: true,
      })

      // 获取_openid
      userProfileUtils.getUserProfile().then(userProfile=>{
        this.globalData.userOpenid = userProfile._openid
      })
    }
  },

  globalData: {
    userOpenid: '',
    needReloadUserChannels: false,
    notifyTemplateId: 'NW6QfOU9WUBKxXaCqHatxASKZwLk2IX9jjnU7ZzGI3k'
  }
})
