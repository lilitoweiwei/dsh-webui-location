# dsh-webui-location

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web UI 的位置信息插件：在输入框的 `+` 菜单里加一行「位置信息」，点一下就把浏览器当前的精确位置写进输入框。

```
位置：31.230416, 121.473701（精度约 ±12 米，2026-11-18 10:31 获取）
```

写完仍是一条普通的用户消息：发送前你可以改、可以删、可以不管。插件不做别的事，也没有设置项。

## 为什么只做位置

浏览器的时区、语言、视口、网络类型、设备形态这些信息，agent 要么自己拿得到，要么拿到了也不改变回答。唯一它拿不到、又真正影响回答的是**用户点头之后的精确坐标**，所以这个插件只搬这一样东西。

## 行为

- 点击时向浏览器请求一次定位，固定使用最高精度（`enableHighAccuracy`）、十秒超时、不使用缓存位置。
- 文本插入在**光标处**，不会替换输入框里已有的内容；已插入的文本再次点击会**再追加一段**，不去重也不覆盖。
- 拿不到位置时不动输入框，改在输入框上方给一条提示，说明是哪一类失败：权限被拒绝、设备无法定位、超时，或当前页面不是安全上下文。
- 精度不是可调档位：`accuracy`（误差半径）由设备和定位源决定并随文本一起给出，通常是手机几十米、笔记本几百米到几公里。

## 安装

本包就是一个 bundle（`package.json` 声明 `dsh.bundle.patch`），它自己的
[cordis.patch.yml](cordis.patch.yml) 里带着那一行。装进 `$DSH_HOME`（DSH 的配置仓库）只需要：

```sh
cd "$DSH_HOME"
dsh plugin --profile web-plus add "$DSH_HOME/plugins/dsh-webui-location"
```

这条命令把它记成 `link:` 依赖、加进 profile 的 `dsh.profile.bundles`；profile 的
`cordis.patch.yml` 里不再有本插件的行。启停在 GUI 的 Plugins 页按 bundle 做。

`lib/` 不进版本管理，克隆后必须构建一次（见下）。

## 权限与隐私

- 定位**只在点击时请求**，插件不监听、不轮询、不后台采集。
- 坐标只被写进输入框的文本，是否发送由你决定；插件自身不发任何网络请求，也不存任何位置。
- 浏览器只在**安全上下文**（HTTPS，或 `localhost` / `127.0.0.1`）下提供定位能力。用内网 IP 或纯 HTTP 域名访问时，点击这一行只会得到一条「需要 HTTPS」的提示。

## 开发

```sh
npm install
npm run build      # lib/index.js（Host，空桩）+ lib/client.js（浏览器）
npm run typecheck
npm test           # 纯函数单测（node --test）
```

改浏览器半边不需要重启服务：client-hmr 会在打包产物变化后热替换。改 Host 半边（本插件几乎是空文件）才需要重启。

### 代码地图

```
src/
├─ index.ts              Host 入口：空桩，让浏览器半边能被 Loader 扫到
└─ client/
   ├─ index.ts           注册菜单行；点击后取位置、拼文本、写入输入框
   ├─ bridge.ts          把一个不可见的 slot 条目挂进输入框，用来取到 composer 的插入动作
   ├─ location.ts        定位请求与失败原因
   ├─ format.ts          写入输入框的那一行（纯函数，带单测）
   └─ platform.d.ts      运行时由页面提供的平台模块的类型声明
```

## 已知限制

- 菜单里这一行排在 Commands 段末尾：DSH 的 `+` 菜单用固定名单决定谁进 Add 段，第三方插件进不去。
- 桌面 Chrome 的定位依赖系统定位服务，某些网络环境下会长期返回「无法定位」。
- 输入框正忙（正在发送、正在执行命令）时插入会被拒绝，此时会提示重试。

## License

MIT
