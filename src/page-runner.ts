import type { Runner } from './runner.js';
import { CdpClient } from './cdp/client.js';

export abstract class PageRunner<TParams, TResult> implements Runner<TParams, TResult> {
  protected params!: TParams;
  protected client!: CdpClient;

  async run(params: TParams): Promise<TResult> {
    this.params = params;
    try {
      await this.navigate();
      await this.ready();
      await this.interact();
      await this.settle();
      return await this.extract();
    } finally {
      await this.dispose();
    }
  }

  async dispose(): Promise<void> {
    if (this.client) await this.client.close().catch(() => {});
  }

  protected async openTab(url: string): Promise<void> {
    this.client = await CdpClient.open(url);
  }

  protected async openBlankTab(): Promise<void> {
    this.client = await CdpClient.open('about:blank');
  }

  abstract navigate(): Promise<void>;
  abstract ready(): Promise<void>;
  abstract extract(): Promise<TResult>;

  interact(): Promise<void> {
    return Promise.resolve();
  }

  settle(): Promise<void> {
    return Promise.resolve();
  }
}
