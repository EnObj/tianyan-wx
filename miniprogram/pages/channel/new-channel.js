// miniprogram/pages/channel/new-channel.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    document: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // options = {
    //   url: encodeURIComponent('https://www.zxzj.me/detail/2968.html')
    // }
    const url = decodeURIComponent(options.url)
    this.loadDocumentByUrl(url)
  },

  loadDocumentByUrl(url){
    wx.showLoading({
      title: '正在加载',
    })
    wx.cloud.callFunction({
      name: 'loadWebDocument',
      data: {
        url
      }
    }).then(res=>{
      wx.hideLoading()
      if(res.result.errCode){
        wx.showModal({
          title: '加载失败',
          content: res.result.errMsg,
          showCancel: false,
          success(){
            wx.navigateBack()
          }
        })
      }else{
        let depth = 0
        res.result.document.list.forEach((item, index)=>{
          item.depth = depth
          if(item.type == 'div'){
            depth++
          }else if(item.type == '/div'){
            depth--
          }
        })
        this.setData({
          document: res.result.document
        })
      }
    }).catch(err=>{
      console.error(err)
      wx.hideLoading()
      wx.showModal({
        title: '加载失败',
        content: '系统异常，请稍后重试或提交反馈',
        showCancel: false,
        success(){
          wx.navigateBack()
        }
      })
    })
  },

  checkboxChange(event){
    this.selectedSelectors = event.detail.value
  },

  submit() {
    if(!(this.selectedSelectors||[]).length){
      wx.showToast({
        title: '请至少选中一个内容',
        icon: 'none'
      })
      return
    }
    wx.showLoading({
      title: '正在处理',
    })
    wx.cloud.callFunction({
      name: 'resolveTyChannel',
      data: {
        templateId: 'other',
        resource: {
          resourceUrl: this.data.document.url,
          channelName: this.data.document.title,
          openResourceUrl: this.data.document.url
        },
        attrs: this.selectedSelectors.map((selector, index)=>{
          return {
            path: selector,
            name: `活动数据${index+1}`
          }
        })
      }
    }).then(res=>{
      if (!res.result.errCode) {
        wx.redirectTo({
          url: '/pages/channel/channel?channelId=' + res.result.channel._id,
        })
      } else {
        wx.showModal({
          title: '操作失败',
          content: res.result.errMsg,
        })
      }
    }).catch(err=>{
      console.error(err)
      wx.hideLoading()
      wx.showModal({
        title: '操作失败',
        content: '系统异常，请稍后重试或提交反馈',
        showCancel: false,
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
  // onShareAppMessage: function () {

  // }
})