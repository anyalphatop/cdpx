import { Command } from 'commander';
import { TabListRunner } from '../runners/tab/list.js';
import { TabCountRunner } from '../runners/tab/count.js';

const tab = new Command('tab').description('Browser tab management');

const list = new Command('list').description('List all open browser tabs');
list.action(async () => console.log(await new TabListRunner().run()));

const count = new Command('count').description('Count open browser tabs');
count.action(async () => console.log(await new TabCountRunner().run()));

tab.addCommand(list);
tab.addCommand(count);

export { tab };
