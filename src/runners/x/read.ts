import { PageRunner } from '../../page-runner.js';
import { config } from '../../config.js';

export interface XReadParams {
  url: string;
  idleWindow?: number;
  comments?: boolean;
  limit?: number;
}

export interface XTweet {
  text: string | null;
  images: string[];
}

export interface XReadResult {
  tweet: XTweet;
  comments?: XTweet[];
}

const EXTRACT_EXPR = `JSON.stringify(
  Array.from(document.querySelectorAll('article[data-testid="tweet"]')).map(a => {
    if (a.querySelector('[data-testid="placementTracking"]')) return null;
    const t = a.querySelector('[data-testid="tweetText"]');
    const imgs = Array.from(a.querySelectorAll('[data-testid="tweetPhoto"] img')).map(i => i.src);
    return { text: t ? t.innerText : null, images: imgs };
  }).filter(Boolean)
)`;

export class XReadRunner extends PageRunner<XReadParams, XReadResult> {
  async navigate(): Promise<void> {
    await this.openBlankTab();
    await this.client.navigateTo(this.params.url);
  }

  async ready(): Promise<void> {
    const idleWindow = this.params.idleWindow ?? config.cdp.networkIdleWindow;
    await this.client.waitForNetworkIdle(idleWindow, ['video.twimg.com', 'proxsee.pscp.tv']);
    await this.client.pollFor(
      `document.querySelectorAll('article[data-testid="tweet"]').length`,
      config.cdp.readyTimeout,
    );
  }

  async interact(): Promise<void> {
    if (!this.params.comments) return;
    const limit = this.params.limit ?? 20;
    const scrollStep = config.cdp.scrollStep;
    const getTotal = () =>
      this.client.eval(`document.querySelectorAll('article[data-testid="tweet"]').length`) as Promise<number>;

    let stableScrolls = 0;

    while (true) {
      const total = await getTotal();
      if (total - 1 >= limit) break;

      await this.client.eval(`window.scrollBy(0, ${scrollStep})`);
      await new Promise(r => setTimeout(r, 1000));

      const newTotal = await getTotal();
      if (newTotal > total) {
        stableScrolls = 0;
      } else {
        stableScrolls++;
        if (stableScrolls >= 3) break;
      }
    }
  }

  async extract(): Promise<XReadResult> {
    const raw = await this.client.eval(EXTRACT_EXPR) as string;
    const tweets = JSON.parse(raw) as XTweet[];
    const limit = this.params.limit ?? 20;

    const result: XReadResult = { tweet: tweets[0] ?? { text: null, images: [] } };
    if (this.params.comments) {
      result.comments = tweets.slice(1, limit + 1);
    }
    return result;
  }
}
