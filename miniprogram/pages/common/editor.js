// miniprogram/pages/common/editor.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: '',
    limit: -1
  },

  finished(event){ 
    this.save(event.detail.value) 
  }, 
 
  contentChange(event){ 
    this.setData({
      content: event.detail.value 
    })
  }, 
 
  confirm(){ 
    this.save(this.data.content) 
  }, 
 
  save(val){ 
    if(!val){
      wx.showToast({
        title: '内容不能为空',
        icon: 'none'
      })
      return
    }
    const channel = this.getOpenerEventChannel() 
    channel.emit('finishedEdit', val) 
    wx.navigateBack() 
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      content: options.init || this.data.content,
      limit: options.limit || 140,
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