const db = wx.cloud.database()

// miniprogram/pages/search/search.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    channels: [],
    keyword: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  cleanKeyword(){
    this.setData({
      keyword: ''
    })
  },

  keywordChange(event) {
    const value = event.detail.value
    this.setData({
      keyword: value
    })
  },

  submit(event){
    const keyword = event.detail.value
    wx.showLoading({
      title: '正在加载',
    })
    db.collection('ty_channel').where({
      name: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    }).get().then(res=>{
      wx.hideLoading({
        success: (res) => {},
      })
      this.setData({
        channels: res.data
      })
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