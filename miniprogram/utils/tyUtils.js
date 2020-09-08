module.exports = {
  signUserChannelsChange(){
    getApp().globalData.needReloadUserChannels = true
  },
  getAll(query){
    return getByPage(query, [])
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