const db = wx.cloud.database()
const tyUtils = require('./../../utils/tyUtils.js')

// miniprogram/pages/channel/template.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    template: null,
    channels: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // options = {
    //   templateId: 'other'
    // }
    db.collection('ty_channel_template').doc(options.templateId).get().then(res => {
      this.setData({
        template: res.data
      })
    })
    this.loadTemplateChannles(options.templateId)
  },

  loadTemplateChannles(templateId){
    // 加载模版下的频道
    tyUtils.getAll(db.collection('ty_channel').where({
      'channelTemplate._id': templateId,
      show: true
    })).then(list=>{
      this.setData({
        channels: list
      })
    })
  },

  submit(event) {
    wx.cloud.callFunction({
      name: 'resolveTyChannel',
      data: {
        templateId: this.data.template._id,
        key: event.detail.value
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

  submitResourceUrl(event){
    wx.navigateTo({
      url: '/pages/channel/new-channel?url=' + encodeURIComponent(event.detail.value),
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