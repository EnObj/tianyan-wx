module.exports = {
  getUserProfile: loadUserProfile
}

function loadUserProfile(noCache) {
  // 先从缓存加载
  if (!noCache) {
    const userProfile = wx.getStorageSync('user_profile')
    if (userProfile) {
      return Promise.resolve(userProfile.data)
    }
  }

  // 自动刷新一次
  return wx.cloud.callFunction({
    name: 'refreshTyUserProfile',
    data: {
      fromUser: wx.getStorageSync('fromUser')
    }
  }).then(res => {
    // 放入本地缓存
    const {
      userProfile
    } = res.result
    saveStorage(userProfile)
    return userProfile
  })
}

function saveStorage(userProfile) {
  wx.setStorage({
    data: {
      data: userProfile,
      time: Date.now()
    },
    key: 'user_profile',
  })
}