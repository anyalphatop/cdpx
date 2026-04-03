import { Command } from 'commander';
import { XReadRunner } from '../runners/x/read.js';
import { XPostsRunner } from '../runners/x/posts.js';

const x = new Command('x').description('x.com');

x
  .command('read')
  .description('read a post and optionally its comments')
  .argument('<url>', 'post URL')
  .option('--comments', 'fetch comments')
  .option('--limit <n>', 'max number of comments to fetch', (v) => parseInt(v, 10), 20)
  .option('--save-images', 'download images to local disk')
  .option('--save-dir <dir>', 'directory to save images (default: ~/Downloads)')
  .action(async (url: string, options: { comments?: boolean; limit?: number; saveImages?: boolean; saveDir?: string }) => {
    const result = await new XReadRunner().run({
      url,
      comments: options.comments,
      limit: options.limit,
      saveImages: options.saveImages,
      saveDir: options.saveDir,
    });
    console.log(JSON.stringify(result));
  });

x
  .command('posts')
  .description('fetch posts from a user')
  .argument('<id>', 'user ID')
  .option('--since <timestamp>', 'start time as Unix timestamp in seconds', (v) => parseInt(v, 10))
  .option('--limit <n>', 'max number of posts to fetch', (v) => parseInt(v, 10), 10)
  .action(async (id: string, options: { since?: number; limit?: number }) => {
    const result = await new XPostsRunner().run({
      id,
      since: options.since,
      limit: options.limit,
    });
    console.log(JSON.stringify(result));
  });

export { x };
