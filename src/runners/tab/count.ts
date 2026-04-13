import type { Runner } from '../../runner.js';
import { getBrowser } from '../../cdp/browser.js';

export class TabCountRunner implements Runner<void, number> {
  async run(): Promise<number> {
    const browser = await getBrowser();
    // 统计所有 context 下的 page 总数
    return browser.contexts().reduce((sum, ctx) => sum + ctx.pages().length, 0);
  }
}
