import type { Runner } from '../../runner.js';
import { getContext } from '../../cdp/browser.js';

export interface Tab {
  title: string;
  url: string;
}

export class TabListRunner implements Runner<void, Tab[]> {
  async run(): Promise<Tab[]> {
    const context = await getContext();
    return Promise.all(
      context.pages().map(async (page) => ({
        title: await page.title(),
        url: page.url(),
      }))
    );
  }
}
