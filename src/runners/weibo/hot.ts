import { PageRunner } from '../../page-runner.js';

interface HotSearchResponse {
  data: {
    hotgovs: Array<{ word: string }>;
    realtime: Array<{ word: string }>;
  };
}

export interface HotResult {
  topics: string[];
}

export class HotRunner extends PageRunner<object, HotResult> {
  private responseData!: HotSearchResponse;

  async navigate(): Promise<void> {
    await this.openBlankTab();
    const promise = this.client.captureJsonResponse('/ajax/side/hotSearch');
    await this.client.navigateTo('https://weibo.com/hot/search');
    this.responseData = await promise as HotSearchResponse;
  }

  async ready(): Promise<void> {}

  async extract(): Promise<HotResult> {
    const { hotgovs, realtime } = this.responseData.data;
    return { topics: [...hotgovs, ...realtime].map(item => item.word) };
  }
}
