# 节点 IP 类型与质量检测

版本：1.0.0。适用 Surge iOS / iPadOS / Mac，以及 Loon iOS / iPadOS。

通过指定节点查询实际出口 IP，再从第三方数据库获取类型和风险标记。结果包括出口 IP、住宅 / 移动网络 / 商业 / 机房类型、“优 / 普通 / 风险”等级、采用来源、组织、ASN 和风险字段。

## 安装地址

| 文件 | 远程地址 |
| --- | --- |
| Surge 模块 | [node-ip-quality.sgmodule](https://raw.githubusercontent.com/nifgg/surge/main/modules/node-ip-quality.sgmodule) |
| Loon 插件 | [node-ip-quality.plugin](https://raw.githubusercontent.com/nifgg/surge/main/plugins/node-ip-quality.plugin) |
| 共用脚本 | [node-ip-quality.js](https://raw.githubusercontent.com/nifgg/surge/main/scripts/node-ip-quality/node-ip-quality.js) |

把对应模块 / 插件地址复制到客户端的远程安装入口。模块和插件已经引用本仓库脚本的完整 URL，客户端会自动下载，不必单独安装 JS。使用 Raw 文本地址，不能把 GitHub 的 `blob` 网页地址当成安装地址。

无需开启 MITM、安装证书或添加分流规则。保持客户端代理服务和脚本功能可用即可。

## Surge：iOS、iPadOS 和 Mac

1. 打开“模块 / Modules”，选择添加远程模块，填入上面的 `.sgmodule` 地址并启用。
2. 编辑这个模块的参数 `policy`，填入现有节点或策略组的完整名称，包括空格和 emoji。例如你的组名是 `🚀 节点选择`，就填写这个完整名称。
3. **订阅节点优先填写所属策略组名称**，并在组内选中待测节点。Surge 某些外部订阅节点不能直接通过显示名称引用，填写组名可以避免这个问题。
4. iOS / iPadOS：在策略选择页面找到“节点 IP 类型与质量”面板，点击刷新。Mac：在 Panels / 信息面板入口找到同名面板并刷新。
5. 换节点后再次刷新。面板保留的是上次结果，没有后台自动轮询。

如果客户端没有显示模块参数编辑入口，可以复制模块为本地文件，修改 `#!arguments=policy:` 后的默认值，再按 Surge 本地模块方式启用。不要直接修改你的订阅节点密码或整份配置。

脚本先通过 Surge 内部 API 核对策略名称；找不到目标时会提示并停止，不会自行改用默认路由。这里的内部 API 不需要你额外开放 HTTP API 监听端口。也可以从脚本列表手动运行 `node-ip-quality`，结果写入日志并尝试发送系统通知；面板运行不会额外发送通知。

Surge 官方 generic 脚本没有提供与 Loon 相同的长按节点上下文，所以本模块使用信息面板入口。模块也不能创建 `[Proxy Group]`。如果想在不影响日常代理选择的情况下检测多个节点，可以自行在主配置建立一个专用 `select` 组，然后把 `policy` 设为这个组名。

动态组（如 `url-test`、`smart`、`fallback`、`load-balance`）可能在不同请求中选中不同节点。想检查具体节点时，建议用手动选择组固定目标。显式填写 `DIRECT` 可以查询本机直连出口。

## Loon：iOS 和 iPadOS

1. 打开插件管理，添加上面的 `.plugin` 远程地址，下载并启用。
2. 进入全部节点 / 服务器列表，长按一个具体节点。
3. 在菜单的脚本操作中选择“IP 类型与质量”。
4. 等待检测结果弹窗，通常几秒内完成；网络或数据源异常时最长约 23 秒返回提示。

请求通过 `node` 参数绑定长按的节点，不需要把它切换为当前全局代理。从脚本编辑器直接运行而没有节点上下文时，只会提示从节点列表启动。

插件使用兼容旧版的 `generic` 配置语法，新版 Loon 可在编辑保存时转换为新语法。重复安装后出现两个同名入口时，停用其中一个；如果之前已在主配置手动加入同名脚本，也应删除重复入口。

## 评级规则

参考 FlClash 提交 `7fd417fb9a9a277c6a9339a8ac87f907df7c25f7`，按所采用来源的数据依次判断：

| 条件 | 等级 |
| --- | --- |
| Tor 或滥用标记命中 | 风险 |
| 未命中上述标记，类型为住宅、移动网络或商业 | 优 |
| 未命中上述标记，类型为机房 | 普通 |

代理 / VPN 标记本身不会降低等级。没有足够数据时显示查询失败，不会把查询失败评成“风险”。“优”不表示速度快、不代表绝对纯净，也不保证特定网站或账号不触发风控。

类型映射：`isp` 对应住宅；`business`、`education`、`government`、`banking` 对应商业；机房标记优先于移动网络和其他类型。ProxyCheck 的 `Residential`、`Business`、`Wireless`、`Hosting` 使用对应类型映射。

ip-api.com 或 IPQuery 明确返回“不是机房、不是移动网络”时，会形成住宅推断候选；仅当其他来源都没有明确类型时采用，并显示“住宅（推断）”。缺失字段显示“未提供”，不等于没有风险。

## 数据来源及请求方式

先通过 ident.me 查询出口，必要时使用 ipify 作为备选。得到 IP 后按以下顺序请求质量数据：

| 批次 | 服务 | 接口（`IP` 替换为出口地址） |
| --- | --- | --- |
| 第一批，并发 | ident.me | `https://ident.me/json` |
| 第一批，并发 | ip-api.com | `http://ip-api.com/json/IP?fields=status,query,isp,org,as,mobile,proxy,hosting` |
| 第一批，并发 | IPQuery | `https://api.ipquery.io/IP?format=json` |
| 第二批 | IPLocate | `https://iplocate.io/api/lookup/IP` |
| 第三批 | ipapi.is | `https://api.ipapi.is/?q=IP` |
| 第四批 | ProxyCheck | `https://proxycheck.io/v3/IP` |

后续批次约间隔 1 秒启动；当前所有请求都失败时会提前进入下一批。采用第一个返回明确类型的来源，不进行多数投票、平均打分或跨来源合并风险标记。所有请求显式指定 Surge `policy` / Loon `node`。

每次质量请求约 8 秒超时，脚本整体约 23 秒兜底，配置执行上限 25 秒。ipapi.is 无密钥响应可能已不包含检测字段，此时会自动跳过。其他服务也可能限流或修改响应结构，失败详情会出现在来源记录中。

这些请求会向第三方 IP 服务提供待查出口 IP。ip-api.com 的免费端点使用 HTTP，其余所用端点使用 HTTPS。脚本不读取订阅地址或密码，不上传整份配置，不修改节点、策略选择或全局模式。

## 与 FlClash 的差异

- 保留六个来源、分批查询、首个明确结果胜出、类型映射及三档评级规则。
- 出口探测使用 ident.me / ipify，不是完整复刻 FlClash 的出口探测器。
- ip-api.com / IPQuery 缺失机房或移动网络字段时，不盲目推断为住宅。
- 不使用 FlClash 的三天缓存；每次点击重新查询，避免高频连续点击。
- 只评估本次取得的 IP。双栈、轮换出口及动态策略组可能产生不同结果。

## 常见问题

| 问题 | 处理方式 |
| --- | --- |
| 模块 / 插件下载失败 | 检查是否使用 Raw 直链，以及当前网络能否访问 `raw.githubusercontent.com` |
| 脚本不存在或仍是旧版本 | 更新模块 / 插件及其引用的脚本资源；使用上面的完整远程安装地址 |
| Surge 提示目标未填写或找不到 | 检查 `policy` 完整名称；外部订阅节点使用所属策略组 |
| Loon 没有检测菜单 | 确认插件启用且已加载，长按具体节点，不是插件卡片 |
| HTTP 429 | 数据源限流，稍后重试 |
| 未提供可识别类型 | 接口可能需密钥、无数据或结构变更；会自动尝试后续来源 |
| 与其他检测工具结论不同 | 对比出口 IP、检测时间和采用来源；不同数据库可能有不同分类 |
| 显示住宅却有 VPN 标记 | 类型和风险标记是独立信息；VPN 本身不会按此评级规则降级 |

## 验证范围

已通过 23 项 Node.js 模拟与发布文件检查，覆盖两端路由参数、Surge 策略名称核对、不同超时单位、首个明确来源胜出、推断兜底、六源解析、风险评级、IPv6 对比、错误处理、HTML 转义及发布文件引用。

尚未完成 Surge / Loon 原生客户端导入、配置解析和真实代理链路验收。模拟测试通过不等于所有客户端版本均已实机验证。

在仓库根目录运行：

```sh
node --test tests/node-ip-quality.test.cjs
```

## 参考来源

- [FlClash 查询与类型判断源码](https://github.com/chen08209/FlClash/blob/7fd417fb9a9a277c6a9339a8ac87f907df7c25f7/lib/common/ip_quality.dart)
- [FlClash 等级源码](https://github.com/chen08209/FlClash/blob/7fd417fb9a9a277c6a9339a8ac87f907df7c25f7/lib/models/ip_quality.dart)
- [Surge JavaScript API](https://manual.nssurge.com/scripting/api.html)、[信息面板](https://manual.nssurge.com/tools/panel.html)、[模块](https://manual.nssurge.com/profile/module.html)、[HTTP API](https://manual.nssurge.com/tools/http-api.html)
- [Loon Script API](https://nsloon.app/docs/Script/script_api/)、[generic 官方示例](https://github.com/Loon0x00/LoonExampleConfig/blob/master/Script/generic_example.js)
- [IP-API 文档](https://ip-api.com/docs/api:json)、[ipapi.is 文档](https://ipapi.is/developers.html)、[ipify](https://www.ipify.org/)

本脚本为独立编写的 JavaScript 实现，参考 FlClash 行为，不是 FlClash 官方模块。FlClash 原仓库采用 GPL-3.0 许可。
