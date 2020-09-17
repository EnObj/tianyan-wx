const wxApiUtils = require("../../utils/wxApiUtils")
const tyUtils = require('./../../utils/tyUtils.js')

const db = wx.cloud.database()

// miniprogram/pages/channel/channel.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    channel: null,
    userChannel: null,
    channelDatas: [],
    showCreatorShowSwitch: false,
    channelLimit: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // options = {
    //   channelId: '7498b5fe5f548b2d011246381b43e773'
    // }
    // 加载channel
    db.collection('ty_channel').doc(options.channelId).get().then(res => {
      const channel = res.data
      this.setData({
        channel: channel,
        showCreatorShowSwitch: getApp().globalData.userProfile._openid == channel.createBy,
        channelLimit: getApp().globalData.userProfile.channelLimit || 19
      })
    }).catch(err=>{
      console.error(err)
      this.setData({
        channel: {
          _id: options.channelId,
          name: "__活动不存在__"
        }
      })
    })
    // 加载用户channel
    db.collection('ty_user_channel').where({
      'channel._id': options.channelId
    }).get().then(res => {
      this.setData({
        userChannel: res.data[0] || null
      })
    })
    // 加载channelData
    this.watchChannelDatas(options.channelId)
  },

  watchChannelDatas(channelId){
    this.setData({
      channelDatas: [],
      channelDatasWatcherOn: false
    })
    this.closeWatcher()
    this.watcher = db.collection('ty_channel_data').where({
      'channel._id': channelId,
      dataChanged: true
    }).orderBy('createTime', 'desc').limit(20).watch({
      onChange: function(snapshot) {
        this.setData({
          channelDatas: snapshot.docs,
          channelDatasWatcherOn: true
        })
      }.bind(this),
      onError: function(err){
        console.log(err)
        this.setData({
          channelDatasWatcherOn: false
        })
      }.bind(this)
    })
  },

  closeWatcher(){
    // 关闭监听
    if(this.watcher){
      this.watcher.close()
    }
  },

  addUserChannel() {
    db.collection('ty_user_channel').where({}).count().then(res=>{
      // 检查额度
      if(res.total >= this.data.channelLimit){
        wx.showModal({
          title: '超出订阅额度',
          content: `当前订阅活动额度限制为${this.data.channelLimit}，请取消其他订阅后重新订阅此活动`,
          cancelText: '提升额度',
          success: function(res){
            if(!res.confirm){
              wx.navigateTo({
                url: '/pages/common/feedback',
              })
            }
          }
        })
      }else{
        // 订阅流程
        this.setData({
          userChannel: {}
        })
        db.collection('ty_user_channel').add({
          data: {
            "channel": this.data.channel,
            "notify": false,
            createTime: Date.now()
          }
        }).then(res => {
          db.collection('ty_user_channel').doc(res._id).get().then(res => {
            this.setData({
              userChannel: res.data
            })
            wx.showToast({
              title: '订阅成功',
              icon: 'none'
            })
          })
          // 标记用户关注渠道有变动
          tyUtils.signUserChannelsChange()
        })
      }
    })
  },

  removeUserChannel() {
    const userChannelId = this.data.userChannel._id
    this.setData({
      userChannel: null
    })
    db.collection('ty_user_channel').doc(userChannelId).remove().then(res => {
      wx.showToast({
        title: '已取消订阅',
        icon: 'none'
      })
      // 标记用户关注渠道有变动
      tyUtils.signUserChannelsChange()
    })
  },

  switchNotify(event) {
    const value = event.detail.value
    // 请求订阅
    if (value) {
      wxApiUtils.askNotify(getApp().globalData.notifyTemplateId).then(()=>{
        this.updateNotify(true)
      },()=>{
        this.updateNotify(false)
      })
    } else {
      this.updateNotify(false)
    }
  },

  updateNotify(value) {
    db.collection('ty_user_channel').doc(this.data.userChannel._id).update({
      data: {
        notify: value
      }
    }).then(res => {
      this.setData({
        'userChannel.notify': value
      })
      // 标记用户关注渠道有变动
      tyUtils.signUserChannelsChange()
    })
  },

  switchTop(event){
    const value = event.detail.value
    db.collection('ty_user_channel').doc(this.data.userChannel._id).update({
      data: {
        top: value,
        updateTime: Date.now()
      }
    }).then(res => {
      this.setData({
        'userChannel.top': value
      })
      // 标记用户关注渠道有变动
      tyUtils.signUserChannelsChange()
    })
  },

  switchCreatorShow(event){
    const value = event.detail.value
    wx.cloud.callFunction({
      name: 'updateTyChannelByCreator',
      data: {
        channelId: this.data.channel._id,
        updateData: {
          creatorShow: value
        }
      }
    }).then(res => {
      if(res.result.errCode){
        throw res.result
      }else{
        this.setData({
          'channel.creatorShow': value
        })
      }
    }).catch(err=>{
      console.error(err)
      wx.showModal({
        title: '切换失败',
        content: '系统异常，请稍后重试或提交反馈',
        showCancel: false,
        success: function(){
          this.setData({
            'channel.creatorShow': !value
          })
        }.bind(this)
      })
    })
  },

  copyOpenResourceUrl(){
    wx.setClipboardData({
      data: this.data.channel.openReourceUrl,
    })
  },

  tapDataDisplayHelp(){
    wx.showModal({
      title: '帮助',
      content: '“数据更新记录”展示当前活动数据最近变化的时间轨迹，在不影响得到“更新”这一基本事实的情况下为了防止敏感内容渗入，活动数据可能被隐藏，如果您认为此处的数据安全无风险，可以通过反馈通道告诉我们，平台确认后将开放展示。',
      cancelText: '反馈',
      success: function(res){
        if(!res.confirm){
          wx.navigateTo({
            url: '/pages/common/feedback',
          })
        }
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
    // 关闭监听
    this.closeWatcher()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.watchChannelDatas(this.data.channel._id)
    setTimeout(wx.stopPullDownRefresh, 400)
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
      title: '分享给你一个活动',
      path: '/pages/channel/channel?channelId=' + this.data.channel._id
    }
  }
})