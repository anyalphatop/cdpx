import { PingRunner } from './runners/ping/ping.js';
import type { PingResult } from './runners/ping/ping.js';
import { TabListRunner } from './runners/tab/list.js';
import { TabCountRunner } from './runners/tab/count.js';
import type { Tab } from './runners/tab/list.js';
import { AiSearchRunner } from './runners/weibo/ai-search.js';
import type { AiSearchParams } from './runners/weibo/ai-search.js';
import { HotRunner } from './runners/weibo/hot.js';
import { PostRunner } from './runners/weibo/post.js';
import type { PostParams } from './runners/weibo/post.js';
import { XReadRunner } from './runners/x/read.js';
import type { XReadParams, XReadResult, XPostContent, XCommentContent } from './runners/x/read.js';
import { XPostsRunner } from './runners/x/posts.js';
import type { XPostsParams, XPost } from './runners/x/posts.js';
import { DouyinVideoDownloadLinkRunner } from './runners/douyin/video.js';
import type { DouyinVideoDownloadLinkParams, DouyinVideoDownloadLinkResult } from './runners/douyin/video.js';
import { config } from './config.js';

export { config };
export type { PingResult, Tab, PostParams, XReadParams, XReadResult, XPostContent, XCommentContent, XPostsParams, XPost, DouyinVideoDownloadLinkParams, DouyinVideoDownloadLinkResult };

export const cdpx = {
  ping: () => new PingRunner().run(),
  tab: {
    list: () => new TabListRunner().run(),
    count: () => new TabCountRunner().run(),
  },
  weibo: {
    aisearch: (params: AiSearchParams) => new AiSearchRunner().run(params),
    hot: () => new HotRunner().run({}),
    post: (params: PostParams) => new PostRunner().run(params),
  },
  x: {
    read: (params: XReadParams) => new XReadRunner().run(params),
    posts: (params: XPostsParams) => new XPostsRunner().run(params),
  },
  douyin: {
    video: {
      getDownloadLink: (params: DouyinVideoDownloadLinkParams) => new DouyinVideoDownloadLinkRunner().run(params),
    },
  },
};
