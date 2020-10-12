module.exports = {
  signUserChannelsChange(){
    getApp().globalData.needReloadUserChannels = true
  },
  getAll(query){
    return getByPage(query, [])
  },
  pushTyChannelHistory(tyChannel){
    let historys = wx.getStorageSync('tyChannelHistorys') || []
    wx.setStorageSync('tyChannelHistorys', historys.filter(history=>{
      return history.tyChannel._id != tyChannel._id
    }).concat([{
      tyChannel,
      time: Date.now()
    }]))
    return Promise.resolve()
  },
  getTyChannelHistorysByTemplateId(channelTemplateId){
    let historys = wx.getStorageSync('tyChannelHistorys') || []
    return Promise.resolve(historys.filter(history=>{
      return history.tyChannel.channelTemplate._id == channelTemplateId
    }))
  },
  pullTyChanneHistory(tyChannelId){
    let historys = wx.getStorageSync('tyChannelHistorys') || []
    wx.setStorageSync('tyChannelHistorys', historys.filter(history=>{
      return history.tyChannel._id != tyChannelId
    }))
    return Promise.resolve()
  },
  getMyTemplates(){
    const myTemplates = wx.getStorageSync('myTemplates')
    // 本地没有记录
    if(!myTemplates){
      return wx.cloud.database().collection('ty_channel_template').where({}).limit(5).get().then(res=>{
        wx.setStorageSync('myTemplates', res.data)
        return res.data
      })
    }
    return Promise.resolve(myTemplates)
  },
  removeMyTemplate(templateId){
    const myTemplates = wx.getStorageSync('myTemplates') || []
    wx.setStorageSync('myTemplates', myTemplates.filter(template=>{
      return template._id != templateId
    }))
    return Promise.resolve()
  },
  pushMyTemplate(template){
    const myTemplates = wx.getStorageSync('myTemplates') || []
    wx.setStorageSync('myTemplates', [...myTemplates, template])
    return Promise.resolve()
  }
}

function getByPage(query, list){
  const pageSize = 20
  return query.skip(list.length).limit(pageSize).get().then(res=>{
    if(res.data.length == pageSize){
      return getByPage(query, list.concat(res.data))
    }
    return list.concat(res.data)
  })
}