//app.js
App({
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      })
    }

    // 查询用户profile，无则新增
    wx.cloud.database().collection('ty_user_profile').where({}).get().then(res => {
      if(res.data[0]){
        this.globalData.userProfile = res.data[0]
      }else{
        wx.cloud.database().collection('ty_user_profile').add({
          data:{
            createTime: Date.now()
          }
        }).then(res=>{
          wx.cloud.database().collection('ty_user_profile').doc(res._id).get().then(res=>{
            this.globalData.userProfile = res.data
          })
        })
      }
    })
  },
  // onUnhandledRejection(err){
  //   console.error(err)
  //   wx.hideLoading()
  //   wx.showModal({
  //     title: '系统异常',
  //     content: '请稍后重试或提交反馈',
  //     showCancel: false,
  //   })
  // },
  globalData: {
    needReloadUserChannels: false,
    userProfile: {},
    notifyTemplateId: 'NW6QfOU9WUBKxXaCqHatxASKZwLk2IX9jjnU7ZzGI3k'
  }
})
