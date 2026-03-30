import { Command } from 'commander';
import { TabsRunner } from '../runners/tabs/tabs.js';

const tabs = new Command('tabs').description('List open browser tabs');

tabs.action(async () => {
  const result = await new TabsRunner().run();
  console.log(JSON.stringify(result, null, 2));
});

export { tabs };
