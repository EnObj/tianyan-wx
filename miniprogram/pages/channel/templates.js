const db = wx.cloud.database()
const tyUtils = require('./../../utils/tyUtils.js')

// miniprogram/pages/channel/templates.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    templates: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    tyUtils.getAll(db.collection('ty_channel_template').where({
      sort: db.command.gte(0)
    }).orderBy('sort', 'desc')).then(list=>{
      tyUtils.getMyTemplates().then(myTemplates=>{
        const myTemplateIds = myTemplates.map(myTemplate=>{
          return myTemplate._id
        })
        this.setData({
          templates: list.map(template=>{
            template.signMine = myTemplateIds.includes(template._id)
            return template
          })
        })
        tyUtils.updateMyTemplates(this.data.templates.filter(template=>{
          return template.signMine
        }))
      })
    })
  },

  openChannelTemplate(event){
    const itemIndex = +event.currentTarget.dataset.itemIndex
    const template = this.data.templates[itemIndex]

    // 缓存
    getApp().globalData.activeTemplate = template

    wx.navigateTo({
      url: '/pages/channel/template?templateId=' + template._id,
    })
  },

  removeMyTemplate(event){
    const itemIndex = +event.currentTarget.dataset.itemIndex
    const template = this.data.templates[itemIndex]

    tyUtils.removeMyTemplate(template._id).then(res=>{
      const updator = {}
      updator[`templates[${itemIndex}].signMine`] = false
      this.setData(updator)

      wx.showToast({
        title: '已从首页移除',
        icon: 'none'
      })
    })
  },

  pushMyTemplate(event){
    const itemIndex = +event.currentTarget.dataset.itemIndex
    const template = this.data.templates[itemIndex]

    tyUtils.pushMyTemplate(template).then(res=>{
      const updator = {}
      updator[`templates[${itemIndex}].signMine`] = true
      this.setData(updator)

      wx.showToast({
        title: '已添加到首页',
        icon: 'none'
      })
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
      title: '探索',
      path: '/pages/channel/templates?fromUser=' + getApp().globalData.userOpenid
    }
  }
})