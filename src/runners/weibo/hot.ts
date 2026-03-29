import { PageRunner } from '../../page-runner.js';

interface HotSearchResponse {
  data: {
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
    return this.responseData.data.realtime.map(item => item.word);
  }
}
