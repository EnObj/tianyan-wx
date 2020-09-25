const db = wx.cloud.database()
const tyUtils = require('./../../utils/tyUtils.js')
const wxApiUtils = require("../../utils/wxApiUtils")

// miniprogram/pages/channel/template.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    template: null,
    channels: [],
    focus: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // options = {
    //   templateId: 'other'
    // }
    this.laodTemplate(options.templateId).then(template => {
      // 设置主题色
      wx.setNavigationBarColor({
        backgroundColor: template.mainColor || '#808080',
        frontColor: '#ffffff',
      })
      this.setData({
        template
      })
    })
    this.loadTemplateChannles(options.templateId)
  },

  laodTemplate(templateId){
    // 检查缓存
    const activeTemplate = getApp().globalData.activeTemplate
    if(activeTemplate && activeTemplate._id == templateId){
      return Promise.resolve(activeTemplate)
    }
    // 查询数据库
    wx.showLoading({
      title: '正在加载',
    })
    return db.collection('ty_channel_template').doc(templateId).get().then(res => {
      wx.hideLoading()
      return res.data
    })
  },

  loadTemplateChannles(templateId){
    // 加载模版下的频道
    tyUtils.getAll(db.collection('ty_channel').where({
      'channelTemplate._id': templateId,
      show: true
    })).then(list => {
      tyUtils.getTyChannelHistorysByTemplateId(templateId).then(historys=>{
        this.setData({
          channels: list.concat(historys.map(history=>{
            return history.tyChannel
          }))
        })
      })
    })
  },

  submit(event) {
    const key = event.detail.value.trim()
    if(!key){
      wx.showToast({
        title: this.data.template.keyName + '不能为空',
        icon: 'none'
      })
      return
    }
    wx.showLoading({
      title: '正在加载',
    })
    wx.cloud.callFunction({
      name: 'resolveTyChannel',
      data: {
        templateId: this.data.template._id,
        key
      }
    }).then(res => {
      wx.hideLoading()
      if (!res.result.errCode) {
        wx.navigateTo({
          url: '/pages/channel/channel?channelId=' + res.result.channel._id,
        })
      } else {
        wx.showModal({
          title: '加载失败',
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

  submitResourceUrl(event){
    const url = event.detail.value.trim()
    if(!url){
      wx.showToast({
        title: '资源地址不能为空',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/channel/new-channel?url=' + encodeURIComponent(url),
    })
  },

  tapInp(){
    this.setData({
      focus: true
    })
  },

  openChannel(event){
    const tapIndex = +event.currentTarget.dataset.channelIndex
    const channel = this.data.channels[tapIndex]

    wx.navigateTo({
      url: '/pages/channel/channel?channelId=' + channel._id,
    })
  },

  showChannelMenu(event){
    const tapIndex = +event.currentTarget.dataset.channelIndex
    const channel = this.data.channels[tapIndex]

    wxApiUtils.showActions([{
      name: '删除',
      callback: function(){
        tyUtils.pullTyChanneHistory(channel._id).then(res=>{
          this.data.channels.splice(tapIndex, 1)
          this.setData({
            channels: this.data.channels
          })
        })
      }.bind(this),
      condition: true
    }])
  },

  tapDisplayHelp(){ 
    wx.showModal({ 
      title: `怎样获取“${this.data.template.keyName}”？`, 
      content: this.data.template.keyHelp, 
      showCancel: false 
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