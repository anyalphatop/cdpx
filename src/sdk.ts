import { PingRunner } from './runners/ping/ping.js';
import type { PingParams } from './runners/ping/ping.js';
import { AisearchRunner } from './runners/weibo/aisearch.js';
import type { AisearchParams } from './runners/weibo/aisearch.js';
import { HotRunner } from './runners/weibo/hot.js';


export const cdpx = {
  ping: (params: PingParams) => new PingRunner().run(params),
  weibo: {
    aisearch: (params: AisearchParams) => new AisearchRunner().run(params),
    hot: () => new HotRunner().run({}),
  },
};
