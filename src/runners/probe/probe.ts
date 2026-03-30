import { PageRunner } from '../../page-runner.js';
import { config } from '../../config.js';

export interface ProbeParams {
  url: string;
  idleWindow?: number;
  excludePatterns?: (string | RegExp)[];
}

export interface ProbeResult {
  url: string;
  networkIdleMs: number;
}

export class ProbeRunner extends PageRunner<ProbeParams, ProbeResult> {
  private startTime!: number;

  async navigate(): Promise<void> {
    await this.openBlankTab();
    this.startTime = Date.now();
    await this.client.navigateTo(this.params.url);
  }

  async ready(): Promise<void> {
    const idleWindow = this.params.idleWindow ?? config.cdp.networkIdleWindow;
    await this.client.waitForNetworkIdle(idleWindow, this.params.excludePatterns);
  }

  async extract(): Promise<ProbeResult> {
    return {
      url: this.params.url,
      networkIdleMs: Date.now() - this.startTime,
    };
  }
}
