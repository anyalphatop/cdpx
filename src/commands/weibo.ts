import { Command } from 'commander';

const weibo = new Command('weibo').description('weibo.com');

weibo
  .command('aisearch')
  .description('AI search')
  .argument('<query>', 'search query')
  .action((query: string) => {
    console.log(`aisearch: ${query}`);
  });

export { weibo };
