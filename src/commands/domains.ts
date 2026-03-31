import { Command } from 'commander';
import { DomainsRunner } from '../runners/domains/domains.js';

const domains = new Command('domains').description('List all remote domains accessed when loading a page');

domains
  .argument('<url>', 'URL to open')
  .option('--idle-window <ms>', 'network idle window in milliseconds', parseInt)
  .action(async (url: string, options: { idleWindow?: number }) => {
    const result = await new DomainsRunner().run({ url, idleWindow: options.idleWindow });
    console.log(JSON.stringify(result.domains));
  });

export { domains };
