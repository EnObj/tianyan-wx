const wxApiUtils = require("../../utils/wxApiUtils")
const tyUtils = require('./../../utils/tyUtils.js')
const userProfileUtils = require('../../utils/userProfileUtils.js')

const db = wx.cloud.database()

// miniprogram/pages/channel/channel.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    channel: null,
    userChannel: null,
    userProfile: null,
    lastChannelData: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // options = {
    //   channelId: 'e656fa635f6d7f5f0079ee5e6e0c1709'
    // }
    // 加载channel
    db.collection('ty_channel').doc(options.channelId).get().then(res => {
      const channel = res.data
      this.setData({
        channel: channel
      })
      tyUtils.pushTyChannelHistory(channel)
    }).catch(err=>{
      console.error(err)
      this.setData({
        channel: {
          _id: options.channelId,
          name: "__活动不存在__"
        }
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
    }).orderBy('createTime', 'desc').limit(1).get().then(res=>{
      this.setData({
        lastChannelData: res.data[0] || null
      })
    })
  },

  addUserChannel() {
    db.collection('ty_user_channel').where({}).count().then(res=>{
      // 检查额度
      if(res.total >= this.data.userProfile.channelLimit){
        wx.showModal({
          title: '超出订阅额度',
          content: `当前订阅活动额度限制为${this.data.userProfile.channelLimit}，请取消其他订阅后重新订阅此活动`,
          showCancel: false,
          // cancelText: '提升额度',
          // success: function(res){
          //   if(!res.confirm){
          //     wx.navigateTo({
          //       url: '/pages/common/feedback',
          //     })
          //   }
          // }
        })
      }else{
        // 订阅流程
        this.setData({
          userChannel: {}
        })
        db.collection('ty_user_channel').add({
          data: {
            "channel": this.data.channel,
            "notify": false,
            createTime: Date.now()
          }
        }).then(res => {
          db.collection('ty_user_channel').doc(res._id).get().then(res => {
            this.setData({
              userChannel: res.data
            })
            wx.showToast({
              title: '订阅成功',
              icon: 'none'
            })
          })
          // 标记用户关注渠道有变动
          tyUtils.signUserChannelsChange()
        })
      }
    })
  },

  removeUserChannel() {
    const userChannelId = this.data.userChannel._id
    this.setData({
      userChannel: null
    })
    db.collection('ty_user_channel').doc(userChannelId).remove().then(res => {
      wx.showToast({
        title: '已取消订阅',
        icon: 'none'
      })
      // 标记用户关注渠道有变动
      tyUtils.signUserChannelsChange()
    })
  },

  switchNotify(event) {
    const value = event.detail.value
    // 请求订阅
    if (value) {
      wxApiUtils.askNotify(getApp().globalData.notifyTemplateId).then(()=>{
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

  switchTop(event){
    const value = event.detail.value
    db.collection('ty_user_channel').doc(this.data.userChannel._id).update({
      data: {
        top: value,
        updateTime: Date.now()
      }
    }).then(res => {
      this.setData({
        'userChannel.top': value
      })
      // 标记用户关注渠道有变动
      tyUtils.signUserChannelsChange()
    })
  },

  switchHiddenName(event){
    const value = event.detail.value
    db.collection('ty_user_channel').doc(this.data.userChannel._id).update({
      data: {
        hiddenName: value,
      }
    }).then(res => {
      this.setData({
        'userChannel.hiddenName': value
      })
      // 标记用户关注渠道有变动
      tyUtils.signUserChannelsChange()
    })
  },

  copyOpenResourceUrl(){
    wx.setClipboardData({
      data: this.data.channel.openReourceUrl,
    })
  },

  tapDataDisplayHelp(){
    wx.showModal({
      title: '帮助',
      content: '在不影响得到“更新”这一基本事实的情况下为了防止敏感内容渗入，数据值可能被隐藏（使用符号“*”覆盖），如果您认为此处的数据安全无风险，可以通过反馈通道告诉我们，平台确认后将开放展示。',
      cancelText: '反馈',
      success: function(res){
        if(!res.confirm){
          wx.navigateTo({
            url: '/pages/common/feedback',
          })
        }
      }
    })
  },

  openTemplate(){
    const template = this.data.channel.channelTemplate
    // 缓存
    getApp().globalData.activeTemplate = template

    wx.navigateTo({
      url: '/pages/channel/template?templateId=' + template._id,
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
      title: '分享给你一个活动',
      path: '/pages/channel/channel?channelId=' + this.data.channel._id
    }
  }
})