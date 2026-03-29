import { PingRunner } from './runners/ping/ping.js';
import type { PingParams } from './runners/ping/ping.js';
import { AiSearchRunner } from './runners/weibo/aiSearch.js';
import type { AiSearchParams, AiSearchResult } from './runners/weibo/aiSearch.js';
import { HotRunner } from './runners/weibo/hot.js';
import type { HotResult } from './runners/weibo/hot.js';


export type { AiSearchResult, HotResult };

export const cdpx = {
  ping: (params: PingParams) => new PingRunner().run(params),
  weibo: {
    aisearch: (params: AiSearchParams) => new AiSearchRunner().run(params),
    hot: () => new HotRunner().run({}),
  },
};
