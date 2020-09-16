const db = wx.cloud.database()
const tyUtils = require('./../../utils/tyUtils.js')

// miniprogram/pages/channel/template.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    template: null,
    channels: [],
    focus: false
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
    tyUtils.getAll(db.collection('ty_channel').where(db.command.or({
      'channelTemplate._id': templateId,
      show: true
    }, {
      'channelTemplate._id': templateId,
      createBy: getApp().globalData.userProfile._openid,
      'creatorShow': true
    }))).then(list => {
      this.setData({
        channels: list
      })
    })
  },

  submit(event) {
    const key = event.detail.value.trim()
    if(!key){
      wx.showToast({
        title: this.data.template.keyName + '不能为空',
        icon: 'none'
      })
      return
    }
    wx.showLoading({
      title: '正在处理',
    })
    wx.cloud.callFunction({
      name: 'resolveTyChannel',
      data: {
        templateId: this.data.template._id,
        key
      }
    }).then(res => {
      wx.hideLoading()
      if (!res.result.errCode) {
        wx.navigateTo({
          url: '/pages/channel/channel?channelId=' + res.result.channel._id,
        })
      } else {
        wx.showModal({
          title: '操作失败',
          content: res.result.errMsg,
          showCancel: false,
        })
      }
    }).catch(err=>{
      console.error(err)
      wx.hideLoading()
      wx.showModal({
        title: '处理失败',
        content: '系统异常，请稍后重试或提交反馈',
        showCancel: false,
      })
    })
  },

  submitResourceUrl(event){
    const url = event.detail.value.trim()
    if(!url){
      wx.showToast({
        title: '资源地址不能为空',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/channel/new-channel?url=' + encodeURIComponent(url),
    })
  },

  tapInp(){
    this.setData({
      focus: true
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