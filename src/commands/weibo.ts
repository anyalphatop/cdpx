import { Command } from 'commander';
import { AisearchRunner } from '../runners/weibo/aisearch.js';
import { HotRunner } from '../runners/weibo/hot.js';

const weibo = new Command('weibo').description('weibo.com');

weibo
  .command('aisearch')
  .description('AI search')
  .argument('<query>', 'search query')
  .action(async (query: string) => {
    const result = await new AisearchRunner().run({ query });
    console.log(result);
  });

weibo
  .command('hot')
  .description('hot search list')
  .action(async () => {
    const items = await new HotRunner().run({});
    items.forEach(item => console.log(item));
  });

export { weibo };
