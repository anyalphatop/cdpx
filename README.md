# cdpx

[English](README.md) | [中文](README.zh-CN.md)

Make any website programmable via Chrome CDP.

## Commands

### `ping`

Test the connection to a Chrome CDP server.

```bash
cdpx ping [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--host <host>` | CDP host | `localhost` |
| `--port <port>` | CDP port | `9222` |
| `--timeout <ms>` | Connection timeout in milliseconds | `5000` |

**Example:**

```bash
cdpx ping
cdpx ping --host 127.0.0.1 --port 9222
```

**Result:**

| Field | Type | Description |
|-------|------|-------------|
| `connected` | `boolean` | Whether the connection succeeded |
| `browser` | `string` | Browser name and version (e.g. `Chrome/131.0.0.0`) |
| `protocolVersion` | `string` | CDP protocol version (e.g. `1.3`) |
| `webSocketDebuggerUrl` | `string` | WebSocket URL for the debugger |
| `error` | `string` | Error message if connection failed |

### `tabs`

List all open tabs in the connected Chrome browser.

```bash
cdpx tabs
```

**Result:**

Returns an array of tab objects.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Tab ID |
| `title` | `string` | Tab title |
| `url` | `string` | Tab URL |
| `type` | `string` | Tab type (e.g. `page`, `background_page`) |

### `probe`

Measure how long a URL takes to reach network idle.

```bash
cdpx probe <url>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `url` | URL to probe |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--idle-window <ms>` | Network idle window in milliseconds | `CDPX_NETWORK_IDLE_WINDOW` or `500` |

**Example:**

```bash
cdpx probe https://weibo.com
cdpx probe https://weibo.com --idle-window 1000
```

**Result:**

Returns the number of milliseconds elapsed from navigation start until network idle.

```
1823
```

### `read`

Fetch a page and extract its article content using Readability.

```bash
cdpx read <url>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `url` | URL to read |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--idle-window <ms>` | Network idle window in milliseconds | `CDPX_NETWORK_IDLE_WINDOW` or `500` |
| `--settle <ms>` | Additional wait in milliseconds after network idle | `0` |

**Example:**

```bash
cdpx read https://example.com/article
cdpx read https://example.com/article --settle 500
```

**Result:**

Returns a JSON object with the following fields.

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string \| null` | Article title |
| `content` | `string \| null` | Processed article content as HTML |
| `textContent` | `string \| null` | Plain text content with all HTML tags removed |
| `length` | `number \| null` | Article length in characters |
| `excerpt` | `string \| null` | Article description or short excerpt |
| `byline` | `string \| null` | Author metadata |
| `dir` | `string \| null` | Content direction |
| `siteName` | `string \| null` | Name of the site |
| `lang` | `string \| null` | Content language |
| `publishedTime` | `string \| null` | Published time |

### `weibo`

Commands for weibo.com.

#### `weibo aisearch`

Search Weibo using AI search and return the result as text.

```bash
cdpx weibo aisearch <query>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `query` | Search query |

**Example:**

```bash
cdpx weibo aisearch "artificial intelligence"
```

**Result:**

Returns the AI-generated search result as a plain text string.

#### `weibo hot`

Fetch the current Weibo hot search list.

```bash
cdpx weibo hot
```

**Result:**

Returns a string array of trending topic names.

```json
["Topic A", "Topic B", "Topic C"]
```

