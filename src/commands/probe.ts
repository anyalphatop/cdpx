import { Command } from 'commander';
import { ProbeRunner } from '../runners/probe/probe.js';

const probe = new Command('probe').description('Measure how long a page takes to reach network idle');

probe
  .argument('<url>', 'URL to probe')
  .option('--idle-window <ms>', 'network idle window in milliseconds', parseInt)
  .action(async (url: string, options: { idleWindow?: number }) => {
    const result = await new ProbeRunner().run({ url, idleWindow: options.idleWindow });
    console.log(`Network idle after ${result.networkIdleMs}ms`);
  });

export { probe };
