import { PingRunner } from './runners/ping/ping.js';
import type { PingParams } from './runners/ping/ping.js';
import { TabsRunner } from './runners/tabs/tabs.js';
import type { TabsParams, Tab } from './runners/tabs/tabs.js';
import { AiSearchRunner } from './runners/weibo/ai-search.js';
import type { AiSearchParams } from './runners/weibo/ai-search.js';
import { HotRunner } from './runners/weibo/hot.js';
import type { HotResult } from './runners/weibo/hot.js';


export type { HotResult, Tab };

export const cdpx = {
  ping: (params: PingParams) => new PingRunner().run(params),
  tabs: (params: TabsParams) => new TabsRunner().run(params),
  weibo: {
    aisearch: (params: AiSearchParams) => new AiSearchRunner().run(params),
    hot: () => new HotRunner().run({}),
  },
};
