# Surge

Surge 远程模块集合，提供 HTTPDNS 拦截、广告平台拦截、应用去广告和节点 IP 类型与质量检测。节点检测同时提供 Loon iOS / iPadOS 插件。

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
| 节点 IP 类型与质量 | [node-ip-quality.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/node-ip-quality.sgmodule) |

模块版本、上游插件日期与版本、内容哈希见 [manifest.json](manifest.json)。

## 节点 IP 类型与质量检测

查询实际出口 IP，显示住宅、移动网络、商业或机房类型，以及“优 / 普通 / 风险”等级、采用来源和风险标记。检测请求绑定指定节点或策略组，无需 MITM 或证书。

| 客户端 | 安装地址 | 使用方式 |
| --- | --- | --- |
| Surge iOS / iPadOS / Mac | [安装模块](https://raw.githubusercontent.com/nifgg/surge/main/modules/node-ip-quality.sgmodule) | 安装到远程模块，填写参数 `policy`，点击检测面板刷新 |
| Loon iOS / iPadOS | [安装插件](https://raw.githubusercontent.com/nifgg/surge/main/plugins/node-ip-quality.plugin) | 安装并启用插件，长按具体节点，选择“IP 类型与质量” |

**Surge 首次使用：**在模块参数 `policy` 中填写现有节点或策略组的完整名称；订阅节点建议填写所属策略组，并在该组中选中待测节点。iOS / iPadOS 在策略选择页刷新检测面板，Mac 在 Panels 信息面板入口刷新。未填写或名称不匹配时会提示，不会默认为直连检测。

**Loon 首次使用：**把上表插件地址添加到插件列表并启用，然后进入全部节点 / 服务器列表，长按一个节点进行检测。脚本会随插件自动下载，无需手动复制 JS 文件。

评级沿用 [FlClash 指定提交](https://github.com/chen08209/FlClash/tree/7fd417fb9a9a277c6a9339a8ac87f907df7c25f7)的类型映射和等级规则；“优”不代表网速快或保证网站不触发风控。缺失字段显示“未提供”，推断住宅会明确标注。已通过 23 项本地模拟与发布文件检查，尚未完成原生客户端实机验收。

完整步骤、判断依据、数据源和故障排查见 [节点检测说明](docs/node-ip-quality.md)。

## 使用

复制上表中的订阅链接，添加到 Surge 的远程模块即可。模块与脚本可直接下载，无需认证；Surge 会自动下载模块引用的脚本。后续更新沿用同一订阅地址。

去广告模块建议使用 Surge iOS 5.14+ 或 Mac 5.9+，以支持模块中的 JQ Body Rewrite。包含 `[MITM]` 的模块需要开启 MITM 并信任证书；哔哩哔哩的 gRPC 处理还需开启 HTTP/2 解密。模块通过 `%APPEND%` 添加上游指定域名。节点检测模块不使用 MITM 或 JQ。

脚本按模块和功能命名，例如 `amap.js`、`bilibili-request.js`、`bilibili-response.js`。脚本使用稳定的模块目录与文件名，Surge 按脚本更新间隔刷新缓存；需要立即生效时请同时更新模块与脚本。JQ 程序已内联到模块，`.jq` 文件用于记录依赖来源。

| 参数 | 适用模块 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `proxy_policy` | 哔哩哔哩 | `Proxy` | 启用空降助手时，需与 Surge 中的实际策略组名称一致 |
| `sponsorBlock` | 哔哩哔哩 | `false` | 保留上游默认关闭设置 |
| `policy` | 节点 IP 类型与质量 | `请填写节点或策略组名称` | 填入实际节点或策略组完整名称后才能检测 |

可莉广告过滤器属于综合模块，与广告平台拦截器、淘宝去广告各有一条返回内容不同的重叠规则；同时启用时，重叠请求的响应取决于最终配置中的匹配顺序。更换同类去广告模块时，建议先停用旧模块，避免叠加处理。

## 来源

去广告及拦截模块的上游插件适配参考 [LoonKissSurge](https://github.com/QingRex/LoonKissSurge)。模块保留原作者署名，权利与使用条件由上游原作者规定。

节点 IP 类型与质量检测为独立编写的 JavaScript 实现，行为参考 FlClash，并按 Surge / Loon 官方脚本 API 适配；不是 FlClash 官方模块。具体参考链接见 [节点检测说明](docs/node-ip-quality.md#参考来源)。
