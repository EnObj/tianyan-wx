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
    db.collection('ty_user_channel').where({}).get().then(res=>{
      this.setData({
        userChannels: res.data
      })
      this.check()
    })
  },

  check(){
    this.data.userChannels.forEach((userChannel,index)=>{
      db.collection('ty_channel_data').where({
        'channel._id': userChannel.channel._id
      }).orderBy('createTime', 'desc').limit(1).get().then(res=>{
        const channelData = res.data[0]
        if(channelData && channelData._id != userChannel.channelData._id){
          // 更新模型
          const updater = {}
          updater[`userChannels[${index}].channelData`] = channelData
          updater[`userChannels[${index}].newData`] = true
          this.setData(updater)
          // 异步更新数据库
          db.collection('ty_user_channel').doc(userChannel._id).update({
            data: {
              channelData: db.command.set(channelData),
              newData: true
            }
          })
        }
      })
    })
  },

  notNew(event){
    const itemIndex = +event.currentTarget.dataset.itemIndex
    const userChannel = this.data.userChannels[itemIndex]
    // 更新模型
    const updater = {}
    updater[`userChannels[${itemIndex}].newData`] = false
    this.setData(updater)
    // 异步更新数据库
    db.collection('ty_user_channel').doc(userChannel._id).update({
      data: {
        newData: false
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