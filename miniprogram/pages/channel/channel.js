const wxApiUtils = require("../../utils/wxApiUtils")
const tyUtils = require('./../../utils/tyUtils.js')

const db = wx.cloud.database()

// miniprogram/pages/channel/channel.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    channel: null,
    userChannel: null,
    channelDatas: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // options = {
    //   channelId: '7498b5fe5f548b2d011246381b43e773'
    // }
    // 加载channel
    db.collection('ty_channel').doc(options.channelId).get().then(res => {
      this.setData({
        channel: res.data
      })
    })
    // 加载用户channel
    db.collection('ty_user_channel').where({
      'channel._id': options.channelId
    }).get().then(res => {
      this.setData({
        userChannel: res.data[0] || null
      })
    })
    // 加载channelData
    db.collection('ty_channel_data').where({
      'channel._id': options.channelId,
      dataChanged: true
    }).orderBy('createTime', 'desc').get().then(res=>{
      this.setData({
        channelDatas: res.data
      })
    })
  },

  addUserChannel() {
    db.collection('ty_user_channel').add({
      data: {
        "channel": this.data.channel,
        "channelData": {},
        "notify": false
      }
    }).then(res => {
      db.collection('ty_user_channel').doc(res._id).get().then(res => {
        this.setData({
          userChannel: res.data
        })
      })
      // 标记用户关注渠道有变动
      tyUtils.signUserChannelsChange()
    })
  },

  removeUserChannel() {
    db.collection('ty_user_channel').doc(this.data.userChannel._id).remove().then(res => {
      this.setData({
        userChannel: null
      })
      // 标记用户关注渠道有变动
      tyUtils.signUserChannelsChange()
    })
  },

  switchNotify(event) {
    const value = event.detail.value
    // 请求订阅
    if (value) {
      wxApiUtils.askNotify('-uC7MFgpZqLROkVO_QILbH23d85gg-ErEM0KavcKP6A').then(()=>{
        this.updateNotify(true)
      },()=>{
        this.updateNotify(false)
      })
    } else {
      this.updateNotify(false)
    }
  },

  updateNotify(value) {
    db.collection('ty_user_channel').doc(this.data.userChannel._id).update({
      data: {
        notify: value
      }
    }).then(res => {
      this.setData({
        'userChannel.notify': value
      })
      // 标记用户关注渠道有变动
      tyUtils.signUserChannelsChange()
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
    return {
      title: '分享给你一个活动',
      path: '/pages/channel/channel?channelId=' + this.data.channel._id
    }
  }
})