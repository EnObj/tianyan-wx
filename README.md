# 小程序 quickstart
一款小程序快速启动模版，包含以下内容：

1. 基础样式：miniprogram/style/my-style.wxss（已默认引入到app.wxss）
2. 常用单页组件，位于：miniprogram/pages/common下（目前仅提供editor）
3. 常用云函数：位于cloundfunctions/，[点我查看](./cloudfunctions.md)
4. 常用utils工具包：位于miniprogram/utils/
5. 示例page：miniprogram/pages/example/index
6. 官方拓展组件：[icon](https://developers.weixin.qq.com/miniprogram/dev/extended/weui/icon.html)，位于miniprogram/components/icon

## 部署方法

第一步：下载代码
```
git clone https://github.com/EnObj/quick-start-wx
```

第二步：打开配置文件[./project.config.json](./project.config.json)修改appid（请提前在[微信公众平台](https://mp.weixin.qq.com/wxopen/waregister?action=step1&token=&lang=zh_CN)申请好）:
```
{
  "setting": {
    "appid": "放置你的appid",
  }
}
```

第三步：导入[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)，完成！

## 参与贡献
如果你有好的意见或建议，欢迎提 Issues 或 Pull Requests，详见：[contributing.md](./contributing.md)

## 联系作者

可以通过以下联系方式找到我：

- 邮箱：laoji52125@163.com
