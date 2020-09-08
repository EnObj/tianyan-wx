const db = wx.cloud.database()
const tyUtils = require('./../../utils/tyUtils.js')

// miniprogram/pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userChannels: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadUserChannels()
  },

  loadUserChannels(){
    // 关闭监听
    this.closeWatchers()
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
          const channelDataMessage = snapshot.docs[0]
          if (channelDataMessage && channelDataMessage._id != (userChannel.channelDataMessage || {})._id) {
            // 更新模型
            const updater = {}
            updater[`userChannels[${index}].channelDataMessage`] = channelDataMessage
            this.setData(updater)
          }
        }.bind(this),
        onError: function(err) {
          wx.showModal({
            content: `链接[${userChannel.channel.key}]断开，请下拉刷新重新建立链接`,
          })
          console.error('the watch closed because of error', err)
        }
      })
    })
  },

  readed(event) {
    const itemIndex = +event.currentTarget.dataset.itemIndex
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
  },

  closeWatchers(){
    // 关闭监听
    (this.watchers || []).forEach(watcher=>{
      watcher.close()
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
      this.loadUserChannels().then(()=>{
        delete getApp().globalData.needReloadUserChannels
      })
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