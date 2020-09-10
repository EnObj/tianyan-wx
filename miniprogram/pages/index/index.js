const db = wx.cloud.database()
const tyUtils = require('./../../utils/tyUtils.js')
const wxApiUtils = require("../../utils/wxApiUtils")

// miniprogram/pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userChannels: [],
    showExplore: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadUserChannels().then(()=>{
      this.setData({
        showExplore: true
      })
      this.channelDataRefreshAnimate = wx.createAnimation({
        timingFunction: 'ease-out',
        duration: 300
      })
    })
  },

  loadUserChannels(){
    // 关闭监听
    this.closeWatchers()
    // 取消全局标记
    delete getApp().globalData.needReloadUserChannels
    // 加载频道
    return tyUtils.getAll(db.collection('ty_user_channel').where({})).then(list => {
      this.setData({
        userChannels: list
      })
      // 监听消息
      this.watchMessage()
    })
  },

  watchMessage() {
    this.watchers = this.data.userChannels.map((userChannel, index) => {
      return db.collection('ty_user_channel_data_message').where({
        'channelData.channel._id': userChannel.channel._id
      }).orderBy('createTime', 'desc').limit(1).watch({
        onChange: function(snapshot) {
          console.log(snapshot)
          const channelDataMessage = snapshot.docs[0]
          // 更新模型
          const updater = {}
          updater[`userChannels[${index}].watcherOn`] = true
          // 加入动画
          // this.channelDataRefreshAnimate.translateX(100).step().translateX(0).step()
          // updater[`userChannels[${index}].refreshAnimate`] = this.channelDataRefreshAnimate.export()
          if (channelDataMessage) {
            updater[`userChannels[${index}].channelDataMessage`] = channelDataMessage
          }
          this.setData(updater)
        }.bind(this),
        onError: function(err) {
          const updater = {}
          // watcher失败，更新模型
          updater[`userChannels[${index}].watcherOn`] = false
          // 标记需要重新加载
          tyUtils.signUserChannelsChange()
          // 取消动画
          // updater[`userChannels[${index}].refreshAnimate`] = null
          this.setData(updater)
          console.error('the watch closed because of error', err)
        }.bind(this)
      })
    })
  },

  tapUnreaded(event){
    const itemIndex = +event.currentTarget.dataset.itemIndex
    this.readed(itemIndex)
  },

  readed(itemIndex) {
    const userChannel = this.data.userChannels[itemIndex]
    // 更新模型
    const updater = {}
    updater[`userChannels[${itemIndex}].channelDataMessage.readed`] = true
    this.setData(updater)
    // 异步更新数据库
    db.collection('ty_user_channel_data_message').doc(userChannel.channelDataMessage._id).update({
      data: {
        readed: true
      }
    })
    // 当前渠道下的所有等待通知的消息标记为skip
    db.collection('ty_user_channel_data_message').where({
      'channelData.channel._id': userChannel.channel._id,
      notify: 'wait'
    }).update({
      data:{
        notify: 'skip'
      }
    })
    // 关闭当前渠道的通知
    this.updateNotify(false, itemIndex)
  },

  closeWatchers(){
    // 关闭监听
    (this.watchers || []).forEach(watcher=>{
      watcher.close()
    })
  },

  switchNotify(event) {
    const itemIndex = +event.currentTarget.dataset.itemIndex
    const userChannel = this.data.userChannels[itemIndex]
    const value = !userChannel.notify
    // 更新模型
    const updater = {}
    updater[`userChannels[${itemIndex}].notify`] = value
    this.setData(updater)
    // 请求订阅
    if (value) {
      wxApiUtils.askNotify('-uC7MFgpZqLROkVO_QILbH23d85gg-ErEM0KavcKP6A').then(()=>{
        this.updateNotify(true, itemIndex)
      },()=>{
        this.updateNotify(false, itemIndex)
      })
    } else {
      this.updateNotify(false, itemIndex)
    }
  },

  updateNotify(value, itemIndex) {
    const userChannel = this.data.userChannels[itemIndex]
    db.collection('ty_user_channel').doc(userChannel._id).update({
      data: {
        notify: value
      }
    }).then(res => {
      const updater = {}
      updater[`userChannels[${itemIndex}].notify`] = value
      this.setData(updater)
    })
  },

  openChannel(event){
    const itemIndex = +event.currentTarget.dataset.itemIndex
    const userChannel = this.data.userChannels[itemIndex]
    // 如果未读，标记为已读
    if(userChannel.channelDataMessage && !userChannel.channelDataMessage.readed){
      this.readed(itemIndex)
    }
    wx.navigateTo({
      url: '/pages/channel/channel?channelId=' + userChannel.channel._id,
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
    if(getApp().globalData.needReloadUserChannels){
      this.loadUserChannels()
    }
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
    // 关闭监听
    this.closeWatchers()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.loadUserChannels().then(res=>{
      wx.stopPullDownRefresh()
    })
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