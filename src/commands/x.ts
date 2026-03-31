import { Command } from 'commander';
import { XReadRunner } from '../runners/x/read.js';

const x = new Command('x').description('x.com');

x
  .command('read')
  .description('read a post and optionally its comments')
  .argument('<url>', 'post URL')
  .option('--comments', 'fetch comments')
  .option('--limit <n>', 'max number of comments to fetch', (v) => parseInt(v, 10), 20)
  .action(async (url: string, options: { comments?: boolean; limit?: number }) => {
    const result = await new XReadRunner().run({
      url,
      comments: options.comments,
      limit: options.limit,
    });
    console.log(JSON.stringify(result));
  });

export { x };
