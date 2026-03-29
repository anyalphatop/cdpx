import { PageRunner } from './page-runner.js';
import { CdpClient } from './cdp/client.js';
import { openTab, closeTab } from './cdp/tab.js';

export abstract class CdpPageRunner<TParams, TResult> extends PageRunner<TParams, TResult> {
  protected cdp!: CdpClient;
  private tabId!: string;

  protected async openTab(url: string): Promise<void> {
    const tab = await openTab(url);
    this.tabId = tab.id;
    this.cdp = await CdpClient.connect(tab.webSocketDebuggerUrl);
  }

  async run(params: TParams): Promise<TResult> {
    this.params = params;
    try {
      await this.navigate();
      await this.ready();
      await this.interact();
      await this.settle();
      return await this.extract();
    } finally {
      this.cdp?.close();
      if (this.tabId) await closeTab(this.tabId).catch(() => {});
    }
  }
}
