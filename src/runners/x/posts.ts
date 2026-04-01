import { PageRunner } from '../../page-runner.js';
import { config } from '../../config.js';

export interface XPostsParams {
  userId: string;
  since?: number;
  limit?: number;
}

export interface XPost {
  id: string;
  time: string;
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTweet(result: any): { id: string; createdAt: string; text: string } | null {
  const tweet = result?.tweet ?? result;
  const legacy = tweet?.legacy;
  if (!legacy || !tweet?.rest_id) return null;
  return {
    id: tweet.rest_id as string,
    createdAt: legacy.created_at as string,
    text: legacy.full_text as string,
  };
}

export class XPostsRunner extends PageRunner<XPostsParams, XPost[]> {
  private posts: XPost[] = [];
  private seenIds = new Set<string>();
  private firstResponseDone = false;
  private reachedTimeLimit = false;

  private processResponse(data: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instructions: any[] =
      (data as any)?.data?.user?.result?.timeline?.timeline?.instructions ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addEntries = instructions.find((i: any) => i.type === 'TimelineAddEntries');

    if (addEntries?.entries) {
      const since = this.params.since;
      const limit = this.params.limit ?? 10;

      for (const entry of addEntries.entries) {
        const tweetResult = entry.content?.itemContent?.tweet_results?.result;
        if (!tweetResult) continue;
        const parsed = parseTweet(tweetResult);
        if (!parsed || this.seenIds.has(parsed.id)) continue;

        const tweetTime = Math.floor(new Date(parsed.createdAt).getTime() / 1000);
        if (since !== undefined && tweetTime < since) {
          this.reachedTimeLimit = true;
          continue;
        }

        this.seenIds.add(parsed.id);
        if (this.posts.length < limit) {
          this.posts.push({
            id: parsed.id,
            time: new Date(parsed.createdAt).toISOString().slice(0, 19).replace('T', ' '),
            text: parsed.text,
          });
        }
      }
    }

    this.firstResponseDone = true;
  }

  async navigate(): Promise<void> {
    await this.openBlankTab();
    await this.client.onJsonResponse('UserTweets', (data) => this.processResponse(data));
    await this.client.navigateTo(`https://x.com/${this.params.userId}`);
  }

  async ready(): Promise<void> {
    await this.client.waitForNetworkIdle(config.cdp.networkIdleWindow, ['video.twimg.com', 'proxsee.pscp.tv']);
    const deadline = Date.now() + config.cdp.readyTimeout;
    while (!this.firstResponseDone && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, config.cdp.pollInterval));
    }
    if (!this.firstResponseDone) throw new Error('No UserTweets response received');
  }

  async interact(): Promise<void> {
    const limit = this.params.limit ?? 10;
    while (this.posts.length < limit && !this.reachedTimeLimit) {
      const prevScrollY = await this.client.eval('window.scrollY') as number;
      await this.client.eval(`window.scrollBy(0, ${config.cdp.scrollStep})`);
      const newScrollY = await this.client.eval('window.scrollY') as number;
      if (newScrollY === prevScrollY) break;
    }
  }

  async extract(): Promise<XPost[]> {
    return this.posts.slice(0, this.params.limit ?? 10);
  }
}
