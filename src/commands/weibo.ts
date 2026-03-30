import { Command } from 'commander';
import { readFileSync } from 'fs';
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
  .option('-f, --file <path>', 'text file path, mutually exclusive with --text')
  .option('-i, --image <paths...>', 'image file paths')
  .option('-o, --topic <topics...>', 'topics to append, e.g. -o 科技 -o AI')
  .action(async (options: { text?: string; file?: string; image?: string[]; topic?: string[] }) => {
    if (options.text && options.file) {
      console.error('Error: --text and --file are mutually exclusive');
      process.exit(1);
    }
    if (!options.text && !options.file && !options.image) {
      console.error('Error: at least one of --text, --file, or --image is required');
      process.exit(1);
    }
    const text = options.file ? readFileSync(options.file, 'utf-8') : options.text;
    await new PostRunner().run({ text, images: options.image, topics: options.topic });
  });

export { weibo };
