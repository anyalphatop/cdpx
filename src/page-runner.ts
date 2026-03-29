import type { Runner } from './runner.js';
import { CdpClient } from './cdp/client.js';
import { openTab, closeTab } from './cdp/tab.js';

export abstract class PageRunner<TParams, TResult> implements Runner<TParams, TResult> {
  protected params!: TParams;
  protected cdp!: CdpClient;
  private tabId!: string;

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
    this.cdp?.close();
    if (this.tabId) await closeTab(this.tabId).catch(() => {});
  }

  protected async openTab(url: string): Promise<void> {
    const tab = await openTab(url);
    this.tabId = tab.id;
    this.cdp = await CdpClient.connect(tab.webSocketDebuggerUrl);
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
