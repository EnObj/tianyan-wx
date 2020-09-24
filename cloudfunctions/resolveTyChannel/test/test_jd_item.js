const urlResolver = require('../resolver/jd_item_urlResolver.js')

urlResolver.resolve('https://item.m.jd.com/product/12622933.html?wxa_abtest=o&utm_source=iosapp&utm_medium=appshare&utm_campaign=t_335139774&utm_term=CopyURL&ad_od=share&gx=RnFmwjIKaDCNmtRP--txVHvKa_A6opvtBH7W').then(res=>{
  console.log(res)
})

urlResolver.resolve('12622933').then(res=>{
  console.log(res)
})

urlResolver.resolve('https://item.jd.com/12622933.html').then(res=>{
  console.log(res)
})