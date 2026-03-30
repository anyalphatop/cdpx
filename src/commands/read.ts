import { Command } from 'commander';
import { ReadRunner } from '../runners/read/read.js';

const read = new Command('read').description('Fetch a page and extract its content using Readability');

read
  .argument('<url>', 'URL to read')
  .option('--idle-window <ms>', 'network idle window in milliseconds', parseInt)
  .option('--settle <ms>', 'additional wait in milliseconds after network idle', parseInt)
  .action(async (url: string, options: { idleWindow?: number; settle?: number }) => {
    const result = await new ReadRunner().run({ url, idleWindow: options.idleWindow, settle: options.settle });
    console.log(JSON.stringify(result));
  });

export { read };
