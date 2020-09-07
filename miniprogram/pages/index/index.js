const db = wx.cloud.database()

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
    return db.collection('ty_user_channel').where({}).get().then(res => {
      this.setData({
        userChannels: res.data
      })
      // 马上进行一次检查
      this.check()
    })
  },

  check() {
    this.data.userChannels.forEach((userChannel, index) => {
      db.collection('ty_user_channel_data_message').where({
        'channelData.channel._id': userChannel.channel._id
      }).orderBy('createTime', 'desc').limit(1).get().then(res => {
        const channelDataMessage = res.data[0]
        if (channelDataMessage && channelDataMessage._id != (userChannel.channelDataMessage || {})._id) {
          // 更新模型
          const updater = {}
          updater[`userChannels[${index}].channelDataMessage`] = channelDataMessage
          this.setData(updater)
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
        readed: true,
        notify: userChannel.channelDataMessage.notify == 'wait' ? 'skip' : userChannel.channelDataMessage.notify
      }
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
    this.checkIntervalId = setInterval(this.check, 1000 * 10)
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    clearInterval(this.checkIntervalId)
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    clearInterval(this.checkIntervalId)
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