const wxApiUtils = require('./../../utils/wxApiUtils.js')
const utils = require('./../../utils/utils.js')

// miniprogram/pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: '初始内容',
    qrcodeResult: ''
  },

  callEditor() {
    wx.navigateTo({
      url: '/pages/common/editor?init=' + this.data.content,
      events: {
        finishedEdit: function(val){
          this.setData({
            content: val
          })
        }.bind(this)
      }
    })
  },

  checkSafeContent(){
    wxApiUtils.checkContentSafe('你好').then(res=>{
      wx.showToast({
        title: '检测通过',
      })
    },  res=>{
      wx.showToast({
        title: '检测不通过',
        icon: 'none'
      })
    })
  },

  checkUnsafeContent(){
    wxApiUtils.checkContentSafe('特3456书yuuo莞6543李zxcz蒜7782法fgnv级').then(res=>{
      wx.showToast({
        title: '检测通过',
      })
    },  res=>{
      wx.showToast({
        title: '检测不通过',
        icon: 'none'
      })
    })
  },

  checkSafeImage(){
    wx.chooseImage({
      count: 1,
      success: function(res){
        wx.cloud.uploadFile({
          filePath: res.tempFilePaths[0],
          cloudPath: 'temp/' + utils.getRandomFileName(res.tempFilePaths[0])
        }).then(res=>{
          wxApiUtils.checkImageSafe(res.fileID).then(res=>{
            wx.showToast({
              title: '检测通过',
            })
          },  res=>{
            wx.showToast({
              title: '检测不通过',
              icon: 'none'
            })
          })
        })
      }.bind(this)
    })
  },

  saveImage(){
    wxApiUtils.askSaveImage().then(res=>{
      return wx.saveImageToPhotosAlbum({
        filePath: 'image/thanks_code.jpg',
        success(){
          wx.showToast({
            title: '保存成功',
          })
        }
      })
    })
  },

  genQrcode(){
    wxApiUtils.genQrcode(this.data.content).then(url=>{
      this.setData({
        qrcodeResult: url
      })
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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