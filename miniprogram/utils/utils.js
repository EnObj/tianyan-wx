module.exports = {
  getStr8Date() {
    const date = new Date()
    return '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate()
  },
  getRandomFileName(from){
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}${from.substr(from.lastIndexOf('.'))}`
  }
}