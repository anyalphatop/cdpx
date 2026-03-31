import { parse } from 'tldts';
import { PageRunner } from '../../page-runner.js';
import { config } from '../../config.js';

export interface DomainsParams {
  url: string;
  idleWindow?: number;
}

export class DomainsRunner extends PageRunner<DomainsParams, string[]> {
  private domains = new Set<string>();

  async navigate(): Promise<void> {
    await this.openBlankTab();
    await this.client.listenRequests((url) => {
      const { domain } = parse(url);
      if (domain) this.domains.add(domain);
    });
    await this.client.navigateTo(this.params.url);
  }

  async ready(): Promise<void> {
    const idleWindow = this.params.idleWindow ?? config.cdp.networkIdleWindow;
    await this.client.waitForNetworkIdle(idleWindow);
  }

  async extract(): Promise<string[]> {
    return [...this.domains].sort();
  }
}
