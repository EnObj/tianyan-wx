const db = wx.cloud.database()

// miniprogram/pages/vip/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userProfile: null,
    now: Date.now(),
    vipFromCode: ''
  },

  vipFromCodeChange(event){
    this.setData({
      vipFromCode: event.detail.value
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    wx.showLoading({
      title: '正在加载',
    })
    db.collection('qs_user_profile').where({}).get().then(res => {
      this.setData({
        userProfile: res.data[0] || {}
      })
      wx.hideLoading()
    })
  },

  startVip() {
    if (!this.data.vipFromCode) {
      wx.showToast({
        title: '请输入激活码',
        icon: 'none'
      })
      return
    }
    wx.showLoading({
      title: '正在处理',
    })
    wx.cloud.callFunction({
      name: 'qsStartVip',
      data: {
        vipFromCode: this.data.vipFromCode
      }
    }).then(res=>{
      wx.hideLoading()
      if(res.result.errCode){
        console.error(res)
        wx.showModal({
          title: '操作失败',
          content: res.result.errMsg,
          showCancel: false
        })
      }else{
        wx.showToast({
          title: '操作成功'
        })
        this.setData({
          'userProfile.vip': res.result.vip,
          vipFromCode: ''
        })
        // 刷新一下上下文
        getApp().globalData.isVip = true
      }
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})