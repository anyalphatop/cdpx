import { PageRunner } from '../../page-runner.js';
import { config } from '../../config.js';

export interface XPostsParams {
  id: string;
  since?: number;  // Unix timestamp in seconds, only return tweets at or after this time
  limit?: number;  // max number of tweets to return, default 10
}

export interface XPost {
  id: string;
  time: number;  // Unix timestamp in seconds
  text: string;
}

// Compatible with two response structures: result.tweet.legacy and result.legacy
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
  // Flag set when the first UserTweets response has been fully processed
  private firstResponseDone = false;
  // Flag set when a tweet older than `since` is found; tweets are in reverse
  // chronological order so no subsequent tweet can satisfy the time filter
  private reachedTimeLimit = false;

  // Called for each intercepted UserTweets response
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

        // Tweet is older than the requested start time; since the timeline is
        // reverse chronological, mark the limit reached and skip
        if (since !== undefined && tweetTime < since) {
          this.reachedTimeLimit = true;
          continue;
        }

        this.seenIds.add(parsed.id);
        if (this.posts.length < limit) {
          this.posts.push({
            id: parsed.id,
            time: tweetTime,
            text: parsed.text,
          });
        }
      }
    }

    this.firstResponseDone = true;
  }

  async navigate(): Promise<void> {
    await this.openBlankTab();
    // Register the listener before navigating so no response is missed
    await this.client.onJsonResponse('UserTweets', (data) => this.processResponse(data));
    await this.client.navigateTo(`https://x.com/${this.params.id}`);
  }

  async ready(): Promise<void> {
    await this.client.waitForNetworkIdle(config.cdp.networkIdleWindow, ['video.twimg.com', 'proxsee.pscp.tv']);
    // waitForNetworkIdle resolves on loadingFinished, but getResponseBody inside
    // onJsonResponse is async, so poll until the first response is fully processed
    const deadline = Date.now() + config.cdp.readyTimeout;
    while (!this.firstResponseDone && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, config.cdp.pollInterval));
    }
    if (!this.firstResponseDone) throw new Error('No UserTweets response received');
  }

  async interact(): Promise<void> {
    const limit = this.params.limit ?? 10;
    // Keep scrolling until we have enough tweets, hit the time limit, or reach the bottom
    await this.client.scrollUntil(() => this.posts.length >= limit || this.reachedTimeLimit);
  }

  async extract(): Promise<XPost[]> {
    return this.posts.slice(0, this.params.limit ?? 10);
  }
}
