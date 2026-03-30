import { Command } from 'commander';
import { AiSearchRunner } from '../runners/weibo/ai-search.js';
import { HotRunner } from '../runners/weibo/hot.js';
import { PostRunner } from '../runners/weibo/post.js';

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

weibo
  .command('post')
  .description('post a weibo')
  .option('-t, --text <text>', 'weibo text content')
  .option('-i, --image <paths...>', 'image file paths')
  .option('-o, --topic <topics...>', 'topics to append, e.g. -o 科技 -o AI')
  .action(async (options: { text?: string; image?: string[]; topic?: string[] }) => {
    await new PostRunner().run({ text: options.text, images: options.image, topics: options.topic });
  });

export { weibo };
