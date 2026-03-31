import { PageRunner } from '../../page-runner.js';
import { config } from '../../config.js';

export interface DomainsParams {
  url: string;
  idleWindow?: number;
}

export interface DomainsResult {
  url: string;
  domains: string[];
}

export class DomainsRunner extends PageRunner<DomainsParams, DomainsResult> {
  private collectedDomains = new Set<string>();

  async navigate(): Promise<void> {
    await this.openBlankTab();
    await this.client.navigateTo(this.params.url);
  }

  async ready(): Promise<void> {
    const idleWindow = this.params.idleWindow ?? config.cdp.networkIdleWindow;
    await this.client.waitForNetworkIdle(idleWindow, [], (url) => {
      try {
        const hostname = new URL(url).hostname;
        if (hostname) this.collectedDomains.add(hostname);
      } catch { /* ignore unparseable URLs */ }
    });
  }

  async extract(): Promise<DomainsResult> {
    return {
      url: this.params.url,
      domains: [...this.collectedDomains].sort(),
    };
  }
}
