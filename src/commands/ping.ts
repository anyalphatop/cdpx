import { Command } from 'commander';
import { PingRunner } from '../runners/ping/ping.js';

const ping = new Command('ping').description('Test Chrome CDP connection');

ping.action(async () => {
  const result = await new PingRunner().run();
  console.log(result);
});

export { ping };
