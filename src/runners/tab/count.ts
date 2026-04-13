import type { Runner } from '../../runner.js';
import { getContext } from '../../cdp/browser.js';

export class TabCountRunner implements Runner<void, number> {
  async run(): Promise<number> {
    const context = await getContext();
    return context.pages().length;
  }
}
