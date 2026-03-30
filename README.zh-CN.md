# cdpx

[English](README.md) | [中文](README.zh-CN.md)

通过 Chrome CDP 让任何网站可编程。

## 安装

```bash
npm install -g @anyalphatop/cdpx
```

## 命令

### `ping`

测试与 Chrome CDP 服务器的连接。

```bash
cdpx ping [options]
```

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--host <host>` | CDP 主机 | `localhost` |
| `--port <port>` | CDP 端口 | `9222` |
| `--timeout <ms>` | 连接超时时间（毫秒） | `5000` |

**示例：**

```bash
cdpx ping
cdpx ping --host 127.0.0.1 --port 9222
```

**返回结果：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `connected` | `boolean` | 是否连接成功 |
| `browser` | `string` | 浏览器名称及版本（如 `Chrome/131.0.0.0`） |
| `protocolVersion` | `string` | CDP 协议版本（如 `1.3`） |
| `webSocketDebuggerUrl` | `string` | 调试器 WebSocket 地址 |
| `error` | `string` | 连接失败时的错误信息 |

### `tabs`

列出已连接 Chrome 浏览器中所有打开的标签页。

```bash
cdpx tabs
```

**返回结果：**

返回一个标签页对象数组。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 标签页 ID |
| `title` | `string` | 标签页标题 |
| `url` | `string` | 标签页 URL |
| `type` | `string` | 标签页类型（如 `page`、`background_page`） |

### `probe`

测量指定 URL 到达 network idle 状态所需的时间。

```bash
cdpx probe <url>
```

**参数：**

| 参数 | 说明 |
|------|------|
| `url` | 要测量的目标 URL |

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--idle-window <ms>` | 判定 network idle 的静默窗口（毫秒） | `CDPX_NETWORK_IDLE_WINDOW` 或 `500` |

**示例：**

```bash
cdpx probe https://weibo.com
cdpx probe https://weibo.com --idle-window 1000
```

**返回结果：**

返回从导航开始到 network idle 所经过的毫秒数。

```
1823
```

### `read`

使用 Readability 获取指定页面的文章内容。

```bash
cdpx read <url>
```

**参数：**

| 参数 | 说明 |
|------|------|
| `url` | 要读取的目标 URL |

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--idle-window <ms>` | 判定 network idle 的静默窗口（毫秒） | `CDPX_NETWORK_IDLE_WINDOW` 或 `500` |
| `--settle <ms>` | network idle 之后的额外等待时间（毫秒） | `0` |

**示例：**

```bash
cdpx read https://example.com/article
cdpx read https://example.com/article --settle 500
```

**返回结果：**

返回一个 JSON 对象，包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | `string \| null` | 文章标题 |
| `content` | `string \| null` | 处理后的文章内容（HTML 格式） |
| `textContent` | `string \| null` | 去除所有 HTML 标签后的纯文本内容 |
| `length` | `number \| null` | 文章字符数 |
| `excerpt` | `string \| null` | 文章描述或摘要 |
| `byline` | `string \| null` | 作者信息 |
| `dir` | `string \| null` | 内容方向 |
| `siteName` | `string \| null` | 网站名称 |
| `lang` | `string \| null` | 内容语言 |
| `publishedTime` | `string \| null` | 发布时间 |

### `weibo`

微博相关命令。

#### `weibo aisearch`

使用微博 AI 搜索功能搜索内容，并以文本形式返回结果。

```bash
cdpx weibo aisearch <query>
```

**参数：**

| 参数 | 说明 |
|------|------|
| `query` | 搜索关键词 |

**示例：**

```bash
cdpx weibo aisearch "人工智能"
```

**返回结果：**

返回 AI 生成的搜索结果纯文本字符串。

#### `weibo hot`

获取当前微博热搜榜单。

```bash
cdpx weibo hot
```

**返回结果：**

返回一个热搜词条名称的字符串数组。

```json
["话题A", "话题B", "话题C"]
```
