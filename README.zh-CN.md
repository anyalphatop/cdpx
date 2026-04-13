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
cdpx ping
```

**示例：**

```bash
cdpx ping
CDPX_HOST=127.0.0.1 CDPX_PORT=9222 cdpx ping
```

**返回结果：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `browserType` | `string` | 浏览器类型 |
| `version` | `string` | 浏览器版本 |

### `tab`

标签页管理。

#### `tab list`

列出已连接 Chrome 浏览器中所有打开的标签页。

```bash
cdpx tab list
```

**返回结果：**

返回一个标签页对象数组。

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 标签页标题 |
| `url` | `string` | 标签页 URL |

#### `tab count`

统计已连接 Chrome 浏览器中打开的标签页数量。

```bash
cdpx tab count
```

**返回结果：**

返回一个整数。

```
5
```

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

### `domains`

列出加载页面时访问的所有注册域名。

```bash
cdpx domains <url>
```

**参数：**

| 参数 | 说明 |
|------|------|
| `url` | 要加载的目标 URL |

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--idle-window <ms>` | 判定 network idle 的静默窗口（毫秒） | `CDPX_NETWORK_IDLE_WINDOW` 或 `500` |

**示例：**

```bash
cdpx domains https://weibo.com
```

**返回结果：**

返回去重后按字母排序的注册域名 JSON 数组。子域名会折叠到注册域名（如 `static.example.com` → `example.com`）。

```json
["sinaimg.cn", "weibo.com", "weibocdn.com"]
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

### `x`

x.com 相关命令。

#### `x read`

读取一条推文及其评论（可选）。

```bash
cdpx x read <url>
```

**参数：**

| 参数 | 说明 |
|------|------|
| `url` | 推文 URL |

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--comments` | 获取评论 | `false` |
| `--limit <n>` | 最多获取评论数量 | `20` |
| `--save-images` | 下载图片到本地 | `false` |
| `--save-dir <dir>` | 图片保存目录 | `~/Downloads` |

**示例：**

```bash
cdpx x read https://x.com/user/status/123456789
cdpx x read https://x.com/user/status/123456789 --comments
cdpx x read https://x.com/user/status/123456789 --comments --limit 50
cdpx x read https://x.com/user/status/123456789 --save-images
cdpx x read https://x.com/user/status/123456789 --save-images --save-dir /tmp/images
```

**返回结果：**

返回一个 JSON 对象，包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `post` | `object` | 主推文 |
| `post.type` | `'post' \| 'article'` | 推文类型 |
| `post.title` | `string \| null` | 标题（仅 article 类型有值） |
| `post.text` | `string \| null` | 推文文本。article 类型中，图片 URL 会按原始位置内嵌在文本中 |
| `post.cover` | `string \| null` | 封面图 URL（仅 article 类型有值） |
| `post.cover_path` | `string \| null` | 封面图本地路径（仅指定 `--save-images` 时有值） |
| `post.images` | `string[] \| null` | 正文图片 URL 列表（仅 article 类型有值） |
| `post.images_path` | `string[] \| null` | 正文图片本地路径列表（仅指定 `--save-images` 时有值） |
| `comments` | `object[]` | 评论列表（仅在指定 `--comments` 时返回） |
| `comments[].text` | `string \| null` | 评论文本 |

#### `x posts`

获取指定用户的推文列表。

```bash
cdpx x posts <id>
```

**参数：**

| 参数 | 说明 |
|------|------|
| `id` | 用户 ID（用户名） |

**选项：**

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--since <timestamp>` | 只返回该 Unix 时间戳（秒）之后的推文 | — |
| `--limit <n>` | 最多获取推文数量 | `10` |

**示例：**

```bash
cdpx x posts elonmusk
cdpx x posts elonmusk --limit 20
cdpx x posts elonmusk --since 1700000000
```

**返回结果：**

返回一个推文对象数组：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 推文 ID |
| `time` | `number` | Unix 时间戳（秒） |
| `text` | `string` | 推文文本 |

### `douyin`

抖音相关命令。

#### `douyin video get-download-link`

获取抖音视频的 MP4 下载链接。

```bash
cdpx douyin video get-download-link <url>
```

**参数：**

| 参数 | 说明 |
|------|------|
| `url` | 抖音分享链接（如 `https://v.douyin.com/xxx/`） |

**示例：**

```bash
cdpx douyin video get-download-link "https://v.douyin.com/e57Hz45rJrA/"
```

**返回结果：**

返回一个 JSON 对象，包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `link` | `string` | MP4 直链下载地址 |

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

#### `weibo post`

发布一条微博。`--text`、`--file`、`--image` 三者至少需要指定一项。

```bash
cdpx weibo post [options]
```

**选项：**

| 选项 | 说明 |
|------|------|
| `-t, --text <text>` | 微博文本内容 |
| `-f, --file <path>` | 文本文件路径，文件内容将作为微博正文。与 `--text` 互斥 |
| `-i, --image <paths...>` | 一张或多张图片的文件路径 |
| `-o, --topic <topics...>` | 一个或多个话题，每个话题格式为 `#话题#`，追加在正文末尾另起一行 |

**示例：**

```bash
# 纯文字
cdpx weibo post -t "今天天气不错"

# 文字加话题
cdpx weibo post -t "今天天气不错" -o 生活 -o 日记

# 从文件读取正文并带图片
cdpx weibo post -f /path/to/content.txt -i /path/to/image.jpg

# 纯图片
cdpx weibo post -i /path/to/image.jpg

# 多张图片加话题
cdpx weibo post -i /path/to/a.jpg /path/to/b.jpg -o 摄影
```
