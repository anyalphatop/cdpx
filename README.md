# cdpx

[English](README.md) | [中文](README.zh-CN.md)

Make any website programmable via Chrome CDP.

## Installation

```bash
npm install -g @anyalphatop/cdpx
```

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
| `browser` | `string` | Browser type (e.g. `chromium`) |
| `version` | `string` | Browser version (e.g. `131.0.0.0`) |
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

### `domains`

List all registered domains accessed when loading a page.

```bash
cdpx domains <url>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `url` | URL to load |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--idle-window <ms>` | Network idle window in milliseconds | `CDPX_NETWORK_IDLE_WINDOW` or `500` |

**Example:**

```bash
cdpx domains https://weibo.com
```

**Result:**

Returns a JSON array of unique registered domain names, sorted alphabetically. Subdomains are collapsed to their registered domain (e.g. `static.example.com` → `example.com`).

```json
["sinaimg.cn", "weibo.com", "weibocdn.com"]
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

### `x`

Commands for x.com.

#### `x read`

Read a post and optionally its comments.

```bash
cdpx x read <url>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `url` | Post URL |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--comments` | Fetch comments | `false` |
| `--limit <n>` | Max number of comments to fetch | `20` |
| `--save-images` | Download images to local disk | `false` |
| `--save-dir <dir>` | Directory to save images | `~/Downloads` |

**Example:**

```bash
cdpx x read https://x.com/user/status/123456789
cdpx x read https://x.com/user/status/123456789 --comments
cdpx x read https://x.com/user/status/123456789 --comments --limit 50
cdpx x read https://x.com/user/status/123456789 --save-images
cdpx x read https://x.com/user/status/123456789 --save-images --save-dir /tmp/images
```

**Result:**

Returns a JSON object with the following fields.

| Field | Type | Description |
|-------|------|-------------|
| `post` | `object` | The main post |
| `post.type` | `'post' \| 'article'` | Post type |
| `post.title` | `string \| null` | Title (article type only) |
| `post.text` | `string \| null` | Post text. For article posts, image URLs are embedded inline at their original positions |
| `post.cover` | `string \| null` | Cover image URL (article type only) |
| `post.cover_path` | `string \| null` | Local path of the downloaded cover image (only when `--save-images` is specified) |
| `post.images` | `string[] \| null` | Body image URLs (article type only) |
| `post.images_path` | `string[] \| null` | Local paths of the downloaded body images (only when `--save-images` is specified) |
| `comments` | `object[]` | Comments (only present when `--comments` is specified) |
| `comments[].text` | `string \| null` | Comment text |

#### `x posts`

Fetch posts from a user's timeline.

```bash
cdpx x posts <id>
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `id` | User ID (username) |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--since <timestamp>` | Only return posts at or after this Unix timestamp (seconds) | — |
| `--limit <n>` | Max number of posts to fetch | `10` |

**Example:**

```bash
cdpx x posts elonmusk
cdpx x posts elonmusk --limit 20
cdpx x posts elonmusk --since 1700000000
```

**Result:**

Returns a JSON array of post objects.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Tweet ID |
| `time` | `number` | Unix timestamp in seconds |
| `text` | `string` | Tweet text |

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

#### `weibo post`

Post a new Weibo. At least one of `--text`, `--file`, or `--image` is required.

```bash
cdpx weibo post [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `-t, --text <text>` | Weibo text content |
| `-f, --file <path>` | Path to a text file whose content will be used as the post body. Mutually exclusive with `--text` |
| `-i, --image <paths...>` | One or more image file paths |
| `-o, --topic <topics...>` | One or more topics to append. Each topic is formatted as `#topic#` and appended on a new line after the text |

**Example:**

```bash
# Text only
cdpx weibo post -t "Hello world"

# Text with topics
cdpx weibo post -t "Hello world" -o Technology -o AI

# Text from file with image
cdpx weibo post -f /path/to/content.txt -i /path/to/image.jpg

# Image only
cdpx weibo post -i /path/to/image.jpg

# Multiple images with topics
cdpx weibo post -i /path/to/a.jpg /path/to/b.jpg -o Travel
```

