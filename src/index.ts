#!/usr/bin/env node

import { Command } from 'commander';
import { createRequire } from 'module';
import { ping } from './commands/ping.js';
import { probe } from './commands/probe.js';
import { read } from './commands/read.js';
import { tab } from './commands/tab.js';
import { domains } from './commands/domains.js';
import { weibo } from './commands/weibo.js';
import { x } from './commands/x.js';
import { douyin } from './commands/douyin.js';
import { closeBrowser } from './cdp/browser.js';

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
program.addCommand(tab);
program.addCommand(domains);
program.addCommand(weibo);
program.addCommand(x);
program.addCommand(douyin);

// 命令执行完后断开 CDP 连接，避免进程挂起
program.parseAsync().finally(() => closeBrowser());
