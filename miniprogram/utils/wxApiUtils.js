const SETTING_STORAGE_KEY = "setting"

module.exports = {
  showActions: function(actions) {
    var itemList = actions.filter(action => {
      return typeof action.condition == "function" ? action.condition() : !!action.condition
    }).map(action => {
      return action.name
    })
    wx.showActionSheet({
      itemList: itemList,
      success(res) {
        console.log(res)
        var action = actions.find(action => {
          return action.name == itemList[res.tapIndex]
        })
        action.callback();
      },
      fail(res) {
        console.log(res.errMsg)
      }
    })
  },

  checkContentSafe(content){
    return wx.cloud.callFunction({
      name: 'checkContentSafe',
      data: {
        content
      }
    }).then(res=>{
      console.log(res)
      if(res.result.errCode == 87014){
        return Promise.reject()
      }
    })
  },

  checkImageSafe(imageFileId){
    return wx.cloud.callFunction({
      name: 'checkImageSafe',
      data: {
        imageFileId
      }
    }).then(res=>{
      console.log(res)
      if(res.result.errCode == 87014){
        return Promise.reject()
      }
    })
  },

  askSaveImage(){
    return new Promise((resolve, reject)=>{
      // 验证授权
      wx.authorize({
        scope: 'scope.writePhotosAlbum',
        success(res){
          // 通过
          resolve()
        },
        fail(){
          wx.showModal({
            content: '此操作需要您打开相册访问权限',
            success(res){
              // 重新申请权限
              if(res.confirm){
                wx.openSetting({
                  success (res) {
                    // 申请成功，下载
                    console.log(res.authSetting)
                    if(res.authSetting['scope.writePhotosAlbum']){
                      resolve()
                    }
                  }
                })
              }
            }
          })
        }
      })
    })
  },

  askNotify(tmplId) {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        withSubscriptions: true,
        success(res) {
          console.log(res)
          if (!res.subscriptionsSetting.mainSwitch || (res.subscriptionsSetting.itemSettings || {})[tmplId] == 'reject') {
            wx.showModal({
              title: '温馨提示',
              content: '此操作需要您打开订阅消息开关',
              success: function (res) {
                if (res.confirm) {
                  wx.openSetting({
                    withSubscriptions: true,
                    success(res) {
                      reject()
                    }
                  })
                } else {
                  reject()
                }
              }
            })
          } else {
            wx.requestSubscribeMessage({
              tmplIds: [tmplId],
              success(res) {
                switch (res[tmplId]) {
                  case 'accept':
                    resolve()
                    break
                  case 'reject':
                    reject()
                    break
                  default:
                    wx.showToast({
                      title: '订阅失败，请稍后重试',
                    })
                    reject()
                    break
                }
              },
              fail(err) {
                console.error(err)
                reject()
              }
            })
          }
        }
      })
    })
  },

  genQrcode(content){
    return wx.cloud.callFunction({
      name: 'genQrcode',
      data: {
        content
      }
    }).then(res=>{
      return res.result
    })
  },

  getSetting: function () {
    // 先从缓存加载
    const setting = wx.getStorageSync(SETTING_STORAGE_KEY)
    if (setting) {
      // 十五分钟内的直接使用
      if (Date.now() - setting.time > 15 * 60 * 1000) {
        // 异步进行一次查库缓存
        loadSettingFromCloudToLocalStorage()
      }
      return Promise.resolve(setting.setting)
    }
    return loadSettingFromCloudToLocalStorage()
  }
}

function loadSettingFromCloudToLocalStorage(){
  return wx.cloud.callFunction({
    name: 'loadSetting'
  }).then(res => {
    // 异步放入缓存
    saveToLocalStorage(res.result)
    return res.result
  })
}

function saveToLocalStorage (setting){
  wx.setStorage({
    data: {
      setting: setting,
      time: Date.now()
    },
    key: SETTING_STORAGE_KEY,
  })
}