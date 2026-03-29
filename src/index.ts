#!/usr/bin/env node

import { Command } from 'commander';
import { createRequire } from 'module';
import { ping } from './commands/ping.js';
import { tabs } from './commands/tabs.js';
import { weibo } from './commands/weibo.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const program = new Command();

program
  .name('cdpx')
  .description('Make any website programmable via Chrome CDP.')
  .version(version);

program.addCommand(ping);
program.addCommand(tabs);
program.addCommand(weibo);

program.parse();
