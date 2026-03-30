# cdpx

[English](README.md) | [中文](README.zh-CN.md)

通过 Chrome CDP 让任何网站可编程。

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

### `weibo hot`

获取当前微博热搜榜单。

```bash
cdpx weibo hot
```

**返回结果：**

返回一个热搜词条名称的字符串数组。

```json
["话题A", "话题B", "话题C"]
```
