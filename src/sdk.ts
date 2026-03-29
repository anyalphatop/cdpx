import { AisearchRunner } from './runners/weibo/aisearch.js';
import type { AisearchParams } from './runners/weibo/aisearch.js';

export const cdpx = {
  weibo: {
    aisearch: (params: AisearchParams) => new AisearchRunner().run(params),
  },
};
