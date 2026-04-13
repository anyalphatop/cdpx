import { Command } from 'commander';
import { PingRunner } from '../runners/ping/ping.js';

const ping = new Command('ping').description('Test Chrome CDP connection');

ping
  .option('-H, --host <host>', 'Chrome CDP host')
  .option('-p, --port <port>', 'Chrome CDP port', (v) => parseInt(v, 10))
  .action(async (opts) => {
    const result = await new PingRunner().run({ host: opts.host, port: opts.port });
    console.log(result);
  });

export { ping };
