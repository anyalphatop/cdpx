#!/usr/bin/env node

import { Command } from 'commander';
import { createRequire } from 'module';
import { ping } from './commands/ping.js';
import { probe } from './commands/probe.js';
import { read } from './commands/read.js';
import { tabs } from './commands/tabs.js';
import { domains } from './commands/domains.js';
import { weibo } from './commands/weibo.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const program = new Command();

program
  .name('cdpx')
  .description('Make any website programmable via Chrome CDP.')
  .version(version);

program.addCommand(ping);
program.addCommand(probe);
program.addCommand(read);
program.addCommand(tabs);
program.addCommand(domains);
program.addCommand(weibo);

program.parse();
