#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('cdpx')
  .description('Make any website programmable via Chrome CDP.')
  .version('1.0.0');

program.parse();
