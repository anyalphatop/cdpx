import { PageRunner } from '../../page-runner.js';

export interface AisearchParams {
  query: string;
}

export interface AisearchResult {
  query: string;
}

export class AisearchRunner extends PageRunner<AisearchParams, AisearchResult> {
  async navigate(): Promise<void> {
    const url = `https://s.weibo.com/aisearch?q=${encodeURIComponent(this.params.query)}&Refer=aisearch_aisearch`;
    await this.openTab(url);
  }

  async ready(): Promise<void> {}

  async extract(): Promise<AisearchResult> {
    return { query: this.params.query };
  }
}
