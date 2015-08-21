# googole-extension-test

----

## 相关
这次要介绍如何在谷歌插件中使用nodejs模块,演示的项目是 **一个后台定时提醒的插件**

## 运行环境
* [nodejs](http://nodejs.org/)
* Windows、Linux 或 MacOS 操作系统
* chrome浏览器
* [browserify](https://github.com/substack/node-browserify)


##基础框架搭建
###创建一个基础的chrome插件框架
可以从[谷歌插件的github](https://github.com/GoogleChrome/chrome-app-samples)克隆相应的例子进行修改

基本架构只需要包含:

* manifest.json (谷歌插件配置文件)
*  background.js (后台逻辑js文件)


##将nodejs库使用转化为浏览器可使用的库

###下载安装browserify
`npm install browserify -g`


###下载[node-schedule](https://github.com/tejasmanohar/node-schedule)库
* `cd /mnt && npm install node-schedule` 
*  `cd node_modules`
* `browserify -r node-schedule/:node-schedule > node-schedule.js `

重点:`browserify -r node-schedule/:node-schedule > node-schedule.js `命令中的`node-schedule/:node-schedule`中`:`后面指定browserify转换后生成的js文件可被`require`的名字
`require(node-schedule)`

* 将生成的node-schedule.js文件复制到项目里面

##编写逻辑代码

###background.js
```javascript
var scheduler = require("node-schedule")
Schedule();


function Schedule() {
	//每5秒弹出test的通知
	scheduler.scheduleJob('*/5 * * * * *', function () {
		notifyMe("test");
	});
}

function notifyMe(msg, url) {
	if (!Notification) {
		alert('Desktop notifications not available in your browser. Try Chromium.');
		return;
	}
	if (Notification.permission !== "granted")
		Notification.requestPermission();
	else {
		var notification = new Notification('test', {
			body: msg,
		});
    };

}


```

###manifest.json
```
{
  "manifest_version": 2,
  "name": "googole-extension-test",
  "version": "1.0",
  "description": "googole-extension-test",
  "permissions": [
    "notifications"
  ],
  "background": {
    "scripts": [
      "node-schedule.js",
      "background.js"
    ]
  }
}
```


###注意事项
>manifest.json中background - >scripts顺序必须是node-schedule.js在background.js前面才能够将node-schedule.js文件中的require函数被background.js识别到(和页面js加载相同原理)

##加载运行
[百度](www.baidu.com)

##[demo地址]()









