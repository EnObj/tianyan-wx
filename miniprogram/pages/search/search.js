const db = wx.cloud.database()
const tyUtils = require('./../../utils/tyUtils.js')

// miniprogram/pages/search/search.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    templates: [],
    channels: [],
    maybeChannels: [],
    showNewChannelDoor: false,
    keyword: '',
    focus: true,
    finishedSearchCount: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    tyUtils.getAll(db.collection('ty_channel_template').where({})).then(list=>{
      this.setData({
        templates: list
      })
    })
  },

  cleanKeyword(){
    this.setData({
      keyword: '',
      focus: true
    })
  },

  startFocus(){
    this.setData({
      channels: [],
      maybeChannels: [],
      finishedSearchCount: 0,
      showNewChannelDoor: false
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
    if(/^https?:\/\//.test(keyword)){
      this.setData({
        showNewChannelDoor: true
      })
    }
    // 分发查询
    this.data.templates.forEach(template=>{
      wx.cloud.callFunction({
        name: 'resolveTyChannel',
        data: {
          templateId: template._id,
          key: keyword
        }
      }).then(res=>{
        wx.hideLoading({
          success: (res) => {},
        })
        this.setData({
          finishedSearchCount: this.data.finishedSearchCount + 1
        })
        if (!res.result.errCode) {
          this.setData({
            channels: this.data.channels.concat([res.result.channel])
          })
        } else {
          // 处理405建议：
          if(res.result.errCode == 405){
            this.setData({
              maybeChannels: this.data.maybeChannels.concat(res.result.advices.map(advice=>{
                return {
                  name: `${advice}`,
                  channelTemplate: template
                }
              }))
            })
          }else{
            console.error(res.result.errMsg)
          }
        }
      }).catch(err=>{
        this.setData({
          finishedSearchCount: this.data.finishedSearchCount + 1
        })
        console.error(err)
      })
    })
  },

  resolveMaybeChannel(event){
    const itemIndex = +event.currentTarget.dataset.itemIndex
    const maybeChannel = this.data.maybeChannels[itemIndex]

    wx.showLoading({
      title: '正在加载',
    })
    wx.cloud.callFunction({
      name: 'resolveTyChannel',
      data: {
        templateId: maybeChannel.channelTemplate._id,
        key: maybeChannel.name
      }
    }).then(res=>{
      wx.hideLoading()
      if (!res.result.errCode) {
        wx.navigateTo({
          url: '/pages/channel/channel?channelId=' + res.result.channel._id,
        })
      }else{
        wx.showModal({
          content: res.result.errMsg,
          showCancel: false,
        })
      }
    }).catch(err=>{
      console.error(err)
      wx.hideLoading()
      wx.showModal({
        title: '加载失败',
        content: '系统异常，请稍后重试或提交反馈',
        showCancel: false,
      })
    })
  },

  newChannel(){
    const url = this.data.keyword
    wx.navigateTo({
      url: '/pages/channel/new-channel?url=' + encodeURIComponent(url),
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