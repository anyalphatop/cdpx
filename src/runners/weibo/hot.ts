import { PageRunner } from '../../page-runner.js';
import { config } from '../../config.js';

export class HotRunner extends PageRunner<object, string[]> {
  async navigate(): Promise<void> {
    await this.openTab('https://weibo.com/hot/search');
  }

  async ready(): Promise<void> {
    await this.client.waitForNetworkIdle();
    const deadline = Date.now() + config.cdp.readyTimeout;
    while (Date.now() < deadline) {
      const count = await this.client.eval(
        `document.querySelectorAll('a[href*="s.weibo.com/weibo?q="]').length`
      );
      if ((count as number) > 0) return;
      await new Promise(r => setTimeout(r, config.cdp.pollInterval));
    }
    throw new Error('Timeout: hot search list did not appear');
  }

  async extract(): Promise<string[]> {
    const json = await this.client.eval(`
      JSON.stringify(
        Array.from(document.querySelectorAll('a[href*="s.weibo.com/weibo?q="]'))
          .map(el => el.innerText?.trim())
          .filter(Boolean)
      )
    `);
    return JSON.parse(json as string);
  }
}
