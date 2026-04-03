import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { PageRunner } from '../../page-runner.js';
import { config } from '../../config.js';

export interface XReadParams {
  url: string;
  comments?: boolean;
  limit?: number;
  saveImages?: boolean;
  saveDir?: string;
}

export interface XPostContent {
  type: 'post' | 'article';
  title: string | null;
  text: string | null;
  cover: string | null;
  images: string[] | null;
}

export interface XCommentContent {
  text: string | null;
}

export interface XReadResult {
  post: XPostContent;
  comments?: XCommentContent[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTweet(result: any): { id: string; type: 'post' | 'article'; title: string | null; text: string; cover: string | null; images: string[] | null } | null {
  const tweet = result?.tweet ?? result;
  const legacy = tweet?.legacy;
  if (!legacy || !tweet?.rest_id) return null;

  // Article tweets store content in article.article_results.result;
  // legacy.full_text is just a t.co placeholder link in this case
  const articleResult = tweet.article?.article_results?.result;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks: any[] = articleResult?.content_state?.blocks ?? [];
  if (blocks.length > 0) {
    const title: string | null = articleResult?.title ?? null;

    // Cover image
    const cover: string | null = articleResult?.cover_media?.media_info?.original_img_url ?? null;

    // Build a mediaId -> URL map from media_entities
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mediaIdToUrl: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const entity of (articleResult?.media_entities ?? []) as any[]) {
      const url = entity?.media_info?.original_img_url;
      if (entity?.media_id && url) mediaIdToUrl[entity.media_id] = url;
    }

    // Build entityKey -> image URL map from entityMap (type: MEDIA)
    const entityKeyToUrl: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const entry of (articleResult?.content_state?.entityMap ?? []) as any[]) {
      if (entry?.value?.type === 'MEDIA') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const item of (entry.value.data?.mediaItems ?? []) as any[]) {
          const url = mediaIdToUrl[item.mediaId];
          if (url) entityKeyToUrl[entry.key] = url;
        }
      }
    }

    // Process blocks in order: text blocks become paragraphs, atomic blocks insert image URLs
    const parts: string[] = [];
    const images: string[] = [];
    for (const block of blocks) {
      if (block.type === 'atomic') {
        // Resolve image URL via the first entityRange key
        const key = String(block.entityRanges?.[0]?.key ?? '');
        const url = entityKeyToUrl[key];
        if (url) {
          parts.push(url);
          images.push(url);
        }
      } else if (block.text) {
        parts.push(block.text as string);
      }
    }

    const text = parts.join('\n\n');
    return { id: tweet.rest_id as string, type: 'article', title, text, cover, images };
  }

  return { id: tweet.rest_id as string, type: 'post', title: null, text: legacy.full_text as string, cover: null, images: null };
}

// Reply tweets start with one or more @mention prefixes (e.g. "@user1 @user2 text").
// Strip them so the comment text contains only the actual content.
function stripReplyPrefix(text: string): string {
  return text.replace(/^(@\w+\s+)+/, '').trim();
}

export class XReadRunner extends PageRunner<XReadParams, XReadResult> {
  private tweetId = '';
  private mainPost: XPostContent = { type: 'post', title: null, text: null, cover: null, images: null };
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
            this.mainPost = { type: t.type, title: t.title, text: t.text, cover: t.cover, images: t.images };
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

    // Download cover and body images via the browser's network environment
    if (this.params.saveImages) {
      const saveDir = this.params.saveDir ?? path.join(os.homedir(), 'Downloads');
      await fs.mkdir(saveDir, { recursive: true });
      const urls: string[] = [];
      if (this.mainPost.cover) urls.push(this.mainPost.cover);
      if (this.mainPost.images) urls.push(...this.mainPost.images);
      for (const url of urls) {
        const filename = path.basename(new URL(url).pathname);
        const base64 = await this.client.fetchAsBase64(url);
        await fs.writeFile(path.join(saveDir, filename), Buffer.from(base64, 'base64'));
      }
    }

    return result;
  }
}
