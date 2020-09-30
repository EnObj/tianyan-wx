// miniprogram/pages/mine/message.js
const db = wx.cloud.database()
const pageSize = 20

Page({

  /**
   * 页面的初始数据
   */
  data: {
    items: [],
    loaded: false,
    more: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadItems()
  },

  loadItems(items = []) {
    wx.showLoading({
      title: '正在加载',
    })
    db.collection('ty_user_channel_data_message').where({}).orderBy('createTime', 'desc').skip(items.length).limit(pageSize).get().then(res => {
      this.setData({
        items: items.concat(res.data),
        more: res.data.length == pageSize,
        loaded: true
      })
      wx.hideLoading()
    })
  },

  openChannel(event){
    const itemIndex = +event.currentTarget.dataset.itemIndex
    const item = this.data.items[itemIndex]

    // 加一层缓存，避免打开时的闪烁
    getApp().globalData.activeChannel = item.channelData.channel

    wx.navigateTo({
      url: '/pages/channel/channel?channelId=' + item.channelData.channel._id
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
    if(this.data.more){
      this.loadItems(this.data.items)
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})