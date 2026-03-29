import { Command } from 'commander';
import { config } from '../config.js';
import { PingRunner } from '../runners/ping/ping.js';

const ping = new Command('ping').description('Test Chrome CDP connection');

ping
  .option('--host <host>', 'CDP host', config.cdp.host)
  .option('--port <port>', 'CDP port', String(config.cdp.port))
  .option('--timeout <ms>', 'connection timeout in milliseconds', String(config.cdp.timeout))
  .action(async (opts: { host: string; port: string; timeout: string }) => {
    const result = await new PingRunner().run({
      host: opts.host,
      port: parseInt(opts.port, 10),
      timeout: parseInt(opts.timeout, 10),
    });
    console.log(result);
  });

export { ping };
