import { Command } from 'commander';
import { config } from '../config.js';
import { TabsRunner } from '../runners/tabs/tabs.js';

const tabs = new Command('tabs').description('List open browser tabs');

tabs.action(async () => {
  const result = await new TabsRunner().run({
    host: config.cdp.host,
    port: config.cdp.port,
    timeout: config.cdp.timeout,
  });
  console.log(JSON.stringify(result, null, 2));
});

export { tabs };
