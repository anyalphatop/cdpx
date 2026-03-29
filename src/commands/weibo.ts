import { Command } from 'commander';
import { AiSearchRunner } from '../runners/weibo/ai-search.js';
import { HotRunner } from '../runners/weibo/hot.js';

const weibo = new Command('weibo').description('weibo.com');

weibo
  .command('aisearch')
  .description('AI search')
  .argument('<query>', 'search query')
  .action(async (query: string) => {
    const result = await new AiSearchRunner().run({ query });
    console.log(result);
  });

weibo
  .command('hot')
  .description('hot search list')
  .action(async () => {
    const result = await new HotRunner().run({});
    console.log(result);
  });

export { weibo };
