// miniprogram/pages/mine/index.js
const db = wx.cloud.database()
const userProfileUtils = require('../../utils/userProfileUtils.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    lastUnreadedMessage: null,
    userProfile: {} 
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
    db.collection('ty_user_channel_data_message').where({
      readed: false
    }).orderBy('createTime', 'desc').limit(1).get().then(res=>{
      this.setData({
        lastUnreadedMessage: res.data[0] || null
      })
    })
    // 加载用户
    userProfileUtils.getUserProfile().then(userProfile=>{
      this.setData({
        userProfile
      })
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
    return {
      title: '追你所爱',
      path: '/pages/index/index?fromUser=' + this.data.userProfile._id,
      imageUrl: '/image/wx-share.png'
    }
  }
})