import type { Runner } from '../../runner.js';
import { config } from '../../config.js';
import { getBrowser } from '../../cdp/browser.js';

export interface Tab {
  title: string;
  url: string;
}

export class TabListRunner implements Runner<void, Tab[]> {
  async run(): Promise<Tab[]> {
    const { timeout } = config.cdp;
    const browser = await getBrowser(timeout);
    const tabs: Tab[] = [];
    // 遍历所有 context 下的 page，收集标签页信息
    for (const context of browser.contexts()) {
      for (const page of context.pages()) {
        tabs.push({
          title: await page.title(),
          url: page.url(),
        });
      }
    }
    return tabs;
  }
}
