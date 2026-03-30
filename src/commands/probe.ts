import { Command } from 'commander';
import { ProbeRunner } from '../runners/probe/probe.js';

const probe = new Command('probe').description('Measure how long a page takes to reach network idle');

probe
  .argument('<url>', 'URL to probe')
  .action(async (url: string) => {
    const result = await new ProbeRunner().run({ url });
    console.log(`Network idle after ${result.networkIdleMs}ms`);
  });

export { probe };
