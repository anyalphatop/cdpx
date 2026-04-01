import { PingRunner } from './runners/ping/ping.js';
import type { PingResult } from './runners/ping/ping.js';
import { TabsRunner } from './runners/tabs/tabs.js';
import type { Tab } from './runners/tabs/tabs.js';
import { AiSearchRunner } from './runners/weibo/ai-search.js';
import type { AiSearchParams } from './runners/weibo/ai-search.js';
import { HotRunner } from './runners/weibo/hot.js';
import { PostRunner } from './runners/weibo/post.js';
import type { PostParams } from './runners/weibo/post.js';
import { XReadRunner } from './runners/x/read.js';
import type { XReadParams, XReadResult, XTweet } from './runners/x/read.js';
import { XPostsRunner } from './runners/x/posts.js';
import type { XPostsParams, XPost } from './runners/x/posts.js';
import { config } from './config.js';

export { config };
export type { PingResult, Tab, PostParams, XReadParams, XReadResult, XTweet, XPostsParams, XPost };

export const cdpx = {
  ping: () => new PingRunner().run(),
  tabs: () => new TabsRunner().run(),
  weibo: {
    aisearch: (params: AiSearchParams) => new AiSearchRunner().run(params),
    hot: () => new HotRunner().run({}),
    post: (params: PostParams) => new PostRunner().run(params),
  },
  x: {
    read: (params: XReadParams) => new XReadRunner().run(params),
    posts: (params: XPostsParams) => new XPostsRunner().run(params),
  },
};
