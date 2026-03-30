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
