# LeanChat 服务端

## 简介

LeanChat 是 [LeanCloud](http://leancloud.cn) [实时通信](https://leancloud.cn/docs/realtime.html) 组件的 Demo，通过该应用你可以学习和了解 LeanCloud 实时通信功能。

应用体验下载地址：[http://fir.im/leanchat](http://fir.im/leanchat)

## 验证签名算法
签名逻辑可能实现在了您的服务器上，没有用 LeanCloud 的 LeanEngine 功能，可以前往 https://leanchat.avosapps.com/convSign 来校验签名算法是否正确。

## LeanChat 项目构成

* [LeanChat-android](https://github.com/leancloud/leanchat-android)：Android 客户端
* [LeanChat-ios](https://github.com/leancloud/leanchat-ios)：iOS 客户端
* [LeanChat-Web](https://github.com/leancloud/leanchat-cloudcode/tree/master/webapp) Web 客户端。在线地址：http://leanchat.avosapps.com/ 
* [Leanchat-cloud-code](https://github.com/leancloud/leanchat-cloudcode)：可选服务端，使用 LeanCloud [云代码](https://leancloud.cn/docs/cloud_code_guide.html) 实现，实现了聊天的签名，更安全。

## LeanChat-Web
网页地址：http://leanchat.avosapps.com/ 	
这个 Web 项目用了前端构建工具 Yeoman 和 gulp 来管理。放在了此 repo 的 [webapp 目录](https://github.com/leancloud/leanchat-cloudcode/tree/master/webapp)。如果您需要在此基础上开发程序的话，需要您阅读 [yeoman 文档](http://yeoman.io/)来安装环境。首先是通过 `sudo npm install -g yo` 来安装 yeoman，其次 按照 [yeoman 的说明](http://yeoman.io/learning/index.html)，先自己创建一个 yeoman 项目。这样基本上搭好了环境。可到 webapp 目录运行命令来调试，主要命令有两个：

* `gulp serve`，这用来启动本地 server，然后打开 http://localhost:9000 即可调试，如图：
![changed1](https://cloud.githubusercontent.com/assets/5022872/8589118/29ffcf0a-2645-11e5-9ef6-a06513f7d860.png)

* `gulp build`，用来 uglify 代码等，编译成最后的生产代码和 style ，输出到了 ./public 里，那么基于 LeanEngine 的约定，会从这里读取文件，所以部署之后就可以看到网站了。
![changed](https://cloud.githubusercontent.com/assets/5022872/8589168/b9345362-2645-11e5-8bd4-5bb78753c07e.png)


## 部署服务端

1. fork
2. 管理台在云代码相关位置填写地址
3. 管理台点击部署

## 文档

* git 仓库部署：[相关文档](https://leancloud.cn/docs/cloud_code_guide.html#部署代码)
* 命令行工具部署：[相关文档](https://leancloud.cn/docs/cloud_code_commandline.html#部署)

## 开发相关

### 相关接口

* `conv_sign`：对聊天操作进行签名

代码详见 [main.js](https://github.com/leancloud/AdventureCloud/blob/master/cloud/main.js)
