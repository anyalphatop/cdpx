import type { Runner } from './runner.js';
import { config } from './config.js';

export abstract class PageRunner<TParams, TResult> implements Runner<TParams, TResult> {
  protected params!: TParams;
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
    if (this.tabId) await this.closeTab(this.tabId).catch(() => {});
  }

  protected async openTab(url: string): Promise<void> {
    const { host, port, timeout } = config.cdp;
    const response = await fetch(
      `http://${host}:${port}/json/new?${encodeURIComponent(url)}`,
      { method: 'PUT', signal: AbortSignal.timeout(timeout) }
    );
    if (!response.ok) throw new Error(`Failed to open tab: HTTP ${response.status}`);
    const tab = await response.json() as { id: string };
    this.tabId = tab.id;
  }

  private async closeTab(tabId: string): Promise<void> {
    const { host, port, timeout } = config.cdp;
    const response = await fetch(
      `http://${host}:${port}/json/close/${tabId}`,
      { signal: AbortSignal.timeout(timeout) }
    );
    if (!response.ok) throw new Error(`Failed to close tab: HTTP ${response.status}`);
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
