# Surge

Surge 远程模块集合，提供 HTTPDNS 拦截、广告平台拦截和应用去广告模块。

## 模块

| 模块 | 订阅地址 |
| --- | --- |
| HTTPDNS拦截器 | [httpdns.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/httpdns.sgmodule) |
| 广告平台拦截器 | [advertisers.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/advertisers.sgmodule) |
| 起点读书去广告 | [qidian.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/qidian.sgmodule) |
| 高德地图去广告 | [amap.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/amap.sgmodule) |
| 小红书去广告 | [xiaohongshu.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/xiaohongshu.sgmodule) |
| 哔哩哔哩去广告 | [bilibili.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/bilibili.sgmodule) |
| 番茄小说去广告 | [fanqie.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/fanqie.sgmodule) |
| 省钱快报去广告 | [shengqian.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/shengqian.sgmodule) |
| 微博去广告 | [weibo.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/weibo.sgmodule) |
| 京东去广告 | [jd.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/jd.sgmodule) |
| 淘宝去广告 | [taobao.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/taobao.sgmodule) |
| 夸克去广告 | [quark.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/quark.sgmodule) |
| 微信小程序去广告 | [wechat-mini.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/wechat-mini.sgmodule) |
| 微信公众号去广告 | [wechat-official.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/wechat-official.sgmodule) |
| 酷安去广告 | [coolapk.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/coolapk.sgmodule) |
| 拼多多去广告 | [pinduoduo.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/pinduoduo.sgmodule) |
| 百度网盘去广告 | [baidu.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/baidu.sgmodule) |
| 可莉广告过滤器 | [kelee.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/kelee.sgmodule) |
| 乐播投屏去广告 | [lebo.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/lebo.sgmodule) |
| 闲鱼去广告 | [goofish.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/goofish.sgmodule) |

模块版本、上游插件日期与版本、内容哈希见 [manifest.json](manifest.json)。

## 使用

复制上表中的订阅链接，添加到 Surge 的远程模块即可。模块与脚本可直接下载，无需认证；Surge 会自动下载模块引用的脚本。后续更新沿用同一订阅地址。

建议使用 Surge iOS 5.14+ 或 Mac 5.9+，以支持模块中的 JQ Body Rewrite。包含 `[MITM]` 的模块需要开启 MITM 并信任证书；哔哩哔哩的 gRPC 处理还需开启 HTTP/2 解密。模块通过 `%APPEND%` 添加上游指定域名。

脚本按模块和功能命名，例如 `amap.js`、`bilibili-request.js`、`bilibili-response.js`。脚本使用稳定的模块目录与文件名，Surge 按脚本更新间隔刷新缓存；需要立即生效时请同时更新模块与脚本。JQ 程序已内联到模块，`.jq` 文件用于记录依赖来源。

| 参数 | 适用模块 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `proxy_policy` | 哔哩哔哩 | `Proxy` | 启用空降助手时，需与 Surge 中的实际策略组名称一致 |
| `sponsorBlock` | 哔哩哔哩 | `false` | 保留上游默认关闭设置 |

可莉广告过滤器属于综合模块，与广告平台拦截器、淘宝去广告各有一条返回内容不同的重叠规则；同时启用时，重叠请求的响应取决于最终配置中的匹配顺序。更换同类去广告模块时，建议先停用旧模块，避免叠加处理。

## 来源

上游插件适配参考 [LoonKissSurge](https://github.com/QingRex/LoonKissSurge)。模块保留原作者署名，权利与使用条件由上游原作者规定。
