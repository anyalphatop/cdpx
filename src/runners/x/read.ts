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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTweet(result: any): { id: string; text: string; images: string[] } | null {
  const tweet = result?.tweet ?? result;
  const legacy = tweet?.legacy;
  if (!legacy || !tweet?.rest_id) return null;

  const mediaItems: any[] = (legacy.extended_entities ?? legacy.entities)?.media ?? [];
  const images: string[] = mediaItems
    .filter((m: any) => m.type === 'photo')
    .map((m: any) => m.media_url_https as string);

  // Strip trailing t.co media URLs from full_text
  const mediaUrls: string[] = mediaItems.map((m: any) => m.url as string).filter(Boolean);
  let text: string = legacy.full_text ?? '';
  for (const url of mediaUrls) {
    text = text.replace(url, '').trim();
  }

  return { id: tweet.rest_id as string, text, images };
}

export class XReadRunner extends PageRunner<XReadParams, XReadResult> {
  private tweetId = '';
  private mainTweet: XTweet = { text: null, images: [] };
  private comments: XTweet[] = [];
  private seenIds = new Set<string>();
  private receivedCount = 0;

  private processResponse(data: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instructions: any[] =
      (data as any)?.data?.threaded_conversation_with_injections_v2?.instructions ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addEntries = instructions.find((i: any) => i.type === 'TimelineAddEntries');
    if (!addEntries?.entries) return;

    for (const entry of addEntries.entries) {
      const entryType: string = entry.content?.entryType;
      if (entryType === 'TimelineTimelineItem') {
        const t = extractTweet(entry.content?.itemContent?.tweet_results?.result);
        if (t && !this.seenIds.has(t.id)) {
          this.seenIds.add(t.id);
          if (t.id === this.tweetId) {
            this.mainTweet = { text: t.text, images: t.images };
          }
        }
      } else if (entryType === 'TimelineTimelineModule') {
        for (const item of entry.content?.items ?? []) {
          const t = extractTweet(item.item?.itemContent?.tweet_results?.result);
          if (t && !this.seenIds.has(t.id) && t.id !== this.tweetId) {
            this.seenIds.add(t.id);
            this.comments.push({ text: t.text, images: t.images });
          }
        }
      }
    }

    this.receivedCount++;
  }

  async navigate(): Promise<void> {
    this.tweetId = new URL(this.params.url).pathname.split('/').pop()!;
    await this.openBlankTab();
    await this.client.onJsonResponse('/TweetDetail?', (data) => this.processResponse(data));
    await this.client.navigateTo(this.params.url);
  }

  async ready(): Promise<void> {
    const idleWindow = this.params.idleWindow ?? config.cdp.networkIdleWindow;
    await this.client.waitForNetworkIdle(idleWindow, ['video.twimg.com', 'proxsee.pscp.tv']);
    // Ensure at least one TweetDetail response has been processed
    const deadline = Date.now() + config.cdp.readyTimeout;
    while (Date.now() < deadline && this.receivedCount === 0) {
      await new Promise(r => setTimeout(r, config.cdp.pollInterval));
    }
    if (this.receivedCount === 0) throw new Error('No TweetDetail response received');
  }

  async interact(): Promise<void> {
    if (!this.params.comments) return;
    const limit = this.params.limit ?? 20;
    const scrollStep = config.cdp.scrollStep;
    let stableScrolls = 0;

    while (this.comments.length < limit) {
      const prevScrollY = await this.client.eval('window.scrollY') as number;

      await this.client.eval(`window.scrollBy(0, ${scrollStep})`);
      await new Promise(r => setTimeout(r, 1500));

      const newScrollY = await this.client.eval('window.scrollY') as number;
      if (newScrollY === prevScrollY) {
        stableScrolls++;
        if (stableScrolls >= 3) break;
      } else {
        stableScrolls = 0;
      }
    }
  }

  async extract(): Promise<XReadResult> {
    const result: XReadResult = { tweet: this.mainTweet };
    if (this.params.comments) {
      const limit = this.params.limit ?? 20;
      result.comments = this.comments.slice(0, limit);
    }
    return result;
  }
}
