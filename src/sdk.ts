import { PingRunner } from './runners/ping/ping.js';
import type { PingResult } from './runners/ping/ping.js';
import { TabsRunner } from './runners/tabs/tabs.js';
import type { Tab } from './runners/tabs/tabs.js';
import { AiSearchRunner } from './runners/weibo/ai-search.js';
import type { AiSearchParams } from './runners/weibo/ai-search.js';
import { HotRunner } from './runners/weibo/hot.js';
import { config } from './config.js';

export { config };
export type { PingResult, Tab };

export const cdpx = {
  ping: () => new PingRunner().run(),
  tabs: () => new TabsRunner().run(),
  weibo: {
    aisearch: (params: AiSearchParams) => new AiSearchRunner().run(params),
    hot: () => new HotRunner().run({}),
  },
};
