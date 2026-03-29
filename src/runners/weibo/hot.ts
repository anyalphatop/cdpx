import { PageRunner } from '../../page-runner.js';

interface HotSearchResponse {
  data: {
    hotgovs: Array<{ word: string }>;
    realtime: Array<{ word: string }>;
  };
}

export class HotRunner extends PageRunner<object, string[]> {
  private responseData!: HotSearchResponse;

  async navigate(): Promise<void> {
    await this.openBlankTab();
    const promise = this.client.captureJsonResponse('/ajax/side/hotSearch');
    await this.client.navigateTo('https://weibo.com/hot/search');
    this.responseData = await promise as HotSearchResponse;
  }

  async ready(): Promise<void> {}

  async extract(): Promise<string[]> {
    const { hotgovs, realtime } = this.responseData.data;
    return [...hotgovs, ...realtime].map(item => item.word);
  }
}
