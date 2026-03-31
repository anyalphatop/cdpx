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

function tweetKey(t: XTweet): string {
  return (t.text ?? '') + '\0' + t.images.join('\0');
}

export class XReadRunner extends PageRunner<XReadParams, XReadResult> {
  private mainTweet: XTweet = { text: null, images: [] };
  private collectedComments: XTweet[] = [];
  private seenKeys = new Set<string>();

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
    // Save main tweet before any scrolling
    const raw = await this.client.eval(EXTRACT_EXPR) as string;
    const tweets = JSON.parse(raw) as XTweet[];
    this.mainTweet = tweets[0] ?? { text: null, images: [] };
  }

  async interact(): Promise<void> {
    if (!this.params.comments) return;
    const limit = this.params.limit ?? 20;
    const scrollStep = config.cdp.scrollStep;

    const collect = async () => {
      const raw = await this.client.eval(EXTRACT_EXPR) as string;
      const tweets = JSON.parse(raw) as XTweet[];
      for (const t of tweets) {
        // If text matches the main tweet, this is the same tweet (possibly with images now loaded)
        if (t.text !== null && t.text === this.mainTweet.text) {
          if (t.images.length > this.mainTweet.images.length) {
            this.mainTweet = { ...t };
          }
          continue;
        }
        const key = tweetKey(t);
        if (!this.seenKeys.has(key)) {
          this.seenKeys.add(key);
          this.collectedComments.push(t);
        }
      }
    };

    await collect();

    let stableScrolls = 0;

    while (this.collectedComments.length < limit) {
      const prevCount = this.collectedComments.length;

      await this.client.eval(`window.scrollBy(0, ${scrollStep})`);
      await new Promise(r => setTimeout(r, 1000));
      await collect();

      if (this.collectedComments.length > prevCount) {
        stableScrolls = 0;
      } else {
        stableScrolls++;
        if (stableScrolls >= 3) break;
      }
    }
  }

  async extract(): Promise<XReadResult> {
    const result: XReadResult = { tweet: this.mainTweet };
    if (this.params.comments) {
      const limit = this.params.limit ?? 20;
      result.comments = this.collectedComments.slice(0, limit);
    }
    return result;
  }
}
