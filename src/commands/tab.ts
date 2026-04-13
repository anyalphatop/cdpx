import { Command } from 'commander';
import { TabListRunner } from '../runners/tab/list.js';

const tab = new Command('tab').description('Browser tab management');

const list = new Command('list').description('List all open browser tabs');
list.action(async () => {
  const result = await new TabListRunner().run();
  console.log(JSON.stringify(result, null, 2));
});

tab.addCommand(list);

export { tab };
