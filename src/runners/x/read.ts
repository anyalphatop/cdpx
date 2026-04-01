import { PageRunner } from '../../page-runner.js';
import { config } from '../../config.js';

export interface XReadParams {
  url: string;
  comments?: boolean;
  limit?: number;
}

export interface XPostContent {
  text: string | null;
}

export interface XCommentContent {
  text: string | null;
}

export interface XReadResult {
  post: XPostContent;
  comments?: XCommentContent[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTweet(result: any): { id: string; text: string } | null {
  const tweet = result?.tweet ?? result;
  const legacy = tweet?.legacy;
  if (!legacy || !tweet?.rest_id) return null;
  return { id: tweet.rest_id as string, text: legacy.full_text as string };
}

// Reply tweets start with one or more @mention prefixes (e.g. "@user1 @user2 text").
// Strip them so the comment text contains only the actual content.
function stripReplyPrefix(text: string): string {
  return text.replace(/^(@\w+\s+)+/, '').trim();
}

export class XReadRunner extends PageRunner<XReadParams, XReadResult> {
  private tweetId = '';
  private mainPost: XPostContent = { text: null };
  private comments: XCommentContent[] = [];
  private seenIds = new Set<string>();
  // Flag set when the first TweetDetail response has been fully processed
  private firstResponseDone = false;

  // Called for each intercepted TweetDetail response
  private processResponse(data: unknown): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instructions: any[] =
      (data as any)?.data?.threaded_conversation_with_injections_v2?.instructions ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addEntries = instructions.find((i: any) => i.type === 'TimelineAddEntries');
    if (!addEntries?.entries) return;

    for (const entry of addEntries.entries) {
      const entryType: string = entry.content?.entryType;
      // TimelineTimelineItem: single tweet entry — may be the main tweet or a top-level reply
      if (entryType === 'TimelineTimelineItem') {
        const t = extractTweet(entry.content?.itemContent?.tweet_results?.result);
        if (t && !this.seenIds.has(t.id)) {
          this.seenIds.add(t.id);
          if (t.id === this.tweetId) {
            this.mainPost = { text: t.text };
          }
        }
      // TimelineTimelineModule: grouped entries (conversation threads / comment threads)
      } else if (entryType === 'TimelineTimelineModule') {
        for (const item of entry.content?.items ?? []) {
          const t = extractTweet(item.item?.itemContent?.tweet_results?.result);
          if (t && !this.seenIds.has(t.id) && t.id !== this.tweetId) {
            this.seenIds.add(t.id);
            this.comments.push({ text: stripReplyPrefix(t.text) });
          }
        }
      }
    }

    this.firstResponseDone = true;
  }

  async navigate(): Promise<void> {
    // Extract tweet ID from URL path (last segment)
    this.tweetId = new URL(this.params.url).pathname.split('/').pop()!;
    await this.openBlankTab();
    // Register listener before navigation so no TweetDetail response is missed
    await this.client.onJsonResponse('/TweetDetail?', (data) => this.processResponse(data));
    await this.client.navigateTo(this.params.url);
  }

  async ready(): Promise<void> {
    await this.client.waitForNetworkIdle(config.cdp.networkIdleWindow, ['video.twimg.com', 'proxsee.pscp.tv']);
    // waitForNetworkIdle resolves on loadingFinished, but getResponseBody inside
    // onJsonResponse is async, so poll until at least one response is fully processed
    const deadline = Date.now() + config.cdp.readyTimeout;
    while (Date.now() < deadline && !this.firstResponseDone) {
      await new Promise(r => setTimeout(r, config.cdp.pollInterval));
    }
    if (!this.firstResponseDone) throw new Error('No TweetDetail response received');
  }

  async interact(): Promise<void> {
    if (!this.params.comments) return;
    const limit = this.params.limit ?? 20;
    await this.client.scrollUntil(() => this.comments.length >= limit);
  }

  async extract(): Promise<XReadResult> {
    const result: XReadResult = { post: this.mainPost };
    if (this.params.comments) {
      const limit = this.params.limit ?? 20;
      result.comments = this.comments.slice(0, limit);
    }
    return result;
  }
}
