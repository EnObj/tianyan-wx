const db = wx.cloud.database()

// miniprogram/pages/channel/template.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    template: null,
    channel: {},
    channels: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    db.collection('ty_channel_template').doc(options.templateId).get().then(res => {
      this.setData({
        template: res.data
      })
    })
    // 加载模版下的流行频道
    db.collection('ty_channel').where({
      'channelTemplate._id': options.templateId
    }).get().then(res=>{
      this.setData({
        channels: res.data
      })
    })
  },

  keyChange(event) {
    this.setData({
      'channel.key': event.detail.value
    })
  },

  submit() {
    wx.cloud.callFunction({
      name: 'resolveTyChannel',
      data: {
        templateId: this.data.template._id,
        key: this.data.channel.key
      }
    }).then(res => {
      if (!res.result.errCode) {
        wx.navigateTo({
          url: '/pages/channel/channel?channelId=' + res.result.channel._id,
        })
      } else {
        wx.showModal({
          title: '操作失败',
          content: res.result.errMsg,
        })
      }
    })
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