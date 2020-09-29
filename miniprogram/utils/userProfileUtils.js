module.exports = {
  setFromUser: function (fromUser) {
    // 什么也不做
    if (!fromUser) {
      return Promise.resolve()
    }

    return loadUserProfile().then(userProfile => {
      // 已经有值了或者是自己，什么也不做
      if (userProfile.fromUser || fromUser == userProfile._openid) {
        return Promise.resolve()
      }

      // 设置数据库
      const db = wx.cloud.database()
      return db.collection('ty_user_profile').doc(userProfile._id).update({
        data: {
          fromUser
        }
      }).then(res => {
        return afterUpdateUserProfile()
      })
    })

  },

  getUserProfile: loadUserProfile
}

function afterUpdateUserProfile() {
  // 删除本地缓存
  wx.removeStorageSync('user_profile')
  return Promise.resolve()
}

function loadUserProfile() {
  // 先从缓存加载
  const userProfile = wx.getStorageSync('user_profile')
  if (userProfile) {
    return Promise.resolve(userProfile.data)
  }

  // 查询数据库（无则新增）
  const db = wx.cloud.database()
  return db.collection('ty_user_profile').where({}).get().then(res => {
    if (res.data[0]) {
      return res.data[0]
    } else {
      return newUserProfile()
    }
  }).then(userProfile => {
    // 放入本地缓存
    wx.setStorage({
      data: {
        data: userProfile,
        time: Date.now()
      },
      key: 'user_profile',
    })
    return userProfile
  })
}

function newUserProfile() {
  const db = wx.cloud.database()
  return db.collection('ty_user_profile').add({
    data: {
      channelLimit: 20,
      createTime: Date.now()
    }
  }).then(res => {
    return db.collection('ty_user_profile').doc(res._id).get().then(res => {
      this.globalData.userProfile = res.data
    })
  })
}