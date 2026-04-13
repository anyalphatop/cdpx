import { Command } from 'commander';
import { DouyinVideoDownloadLinkRunner } from '../runners/douyin/video.js';

const douyin = new Command('douyin').description('Douyin operations');

const video = new Command('video').description('Douyin video operations');
douyin.addCommand(video);

video
  .command('get-download-link')
  .description('Get the MP4 download link for a Douyin video')
  .argument('<url>', 'Douyin share URL')
  .action(async (url: string) => console.log(await new DouyinVideoDownloadLinkRunner().run({ url })));

export { douyin };
