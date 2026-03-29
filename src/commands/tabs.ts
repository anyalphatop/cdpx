import { Command } from 'commander';
import { config } from '../config.js';
import { TabsRunner } from '../runners/tabs/tabs.js';

const tabs = new Command('tabs').description('List open browser tabs');

tabs
  .option('--host <host>', 'CDP host', config.cdp.host)
  .option('--port <port>', 'CDP port', String(config.cdp.port))
  .option('--timeout <ms>', 'connection timeout in milliseconds', String(config.cdp.timeout))
  .action(async (opts: { host: string; port: string; timeout: string }) => {
    const result = await new TabsRunner().run({
      host: opts.host,
      port: parseInt(opts.port, 10),
      timeout: parseInt(opts.timeout, 10),
    });
    console.log(JSON.stringify(result, null, 2));
  });

export { tabs };
