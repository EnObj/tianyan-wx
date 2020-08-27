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
}