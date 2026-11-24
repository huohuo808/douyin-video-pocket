# 抖存 · 抖音视频提取

零依赖的网页工具，包含服务端解析、视频预览及流式下载。

## 本地运行

需要 Node.js 22 或更高版本：

```sh
node scripts/dev.mjs
```

浏览器访问 http://127.0.0.1:4318 。本地服务器仅监听本机。

## 验证与构建

```sh
node --test tests/parser.test.mjs
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

`worker/index.js` 为源代码，构建产物为 `dist/server/index.js`，兼容 Cloudflare Workers 的 fetch 接口。

## 解析方式

识别中文分享文案中的抖音短链、作品页与 modal_id 链接，通过匿名设备会话读取公开分享页的路由数据，选择平台返回的高码率播放地址，将抖音播放接口 `/playwm/` 切换为 `/play/` 来取得平台无水印视频流。无水印下载失败时不会回退到带水印版本。下载端校验域名和每次跳转，流式传输视频并支持 Range 请求。不会要求提供抖音账号或 Cookie，不使用第三方视频解析服务。

匿名设备会话及解析结果仅在服务器进程内短暂缓存；不持久化用户历史。只支持公开的视频作品。图文、直播、删除或私密作品不可提取。抖音访问限制可能导致解析失败；平台提供的视频不等于创作者上传前的源文件，创作者自己加在画面中的标识仍会保留。

在线使用：<https://douyin-video-pocket.roanspoonbill16.chatgpt.site/>
