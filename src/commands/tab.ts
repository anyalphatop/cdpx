import { Command } from 'commander';
import { TabListRunner } from '../runners/tab/list.js';
import { TabCountRunner } from '../runners/tab/count.js';

const tab = new Command('tab').description('Browser tab management');

const list = new Command('list').description('List all open browser tabs');
list.action(async () => {
  const result = await new TabListRunner().run();
  console.log(result);
});

const count = new Command('count').description('Count open browser tabs');
count.action(async () => {
  const result = await new TabCountRunner().run();
  console.log(result);
});

tab.addCommand(list);
tab.addCommand(count);

export { tab };
