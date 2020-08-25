// miniprogram/pages/common/editor.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    init: ''
  },

  finished(event){ 
    this.save(event.detail.value) 
  }, 
 
  contentChange(event){ 
    this.contentVal = event.detail.value 
  }, 
 
  confirm(){ 
    this.save(this.contentVal) 
  }, 
 
  save(val){ 
    const channel = this.getOpenerEventChannel() 
    channel.emit('finishedEdit', val) 
    wx.navigateBack() 
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      init: options.init || this.data.init
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
  // onShareAppMessage: function () {

  // }
})