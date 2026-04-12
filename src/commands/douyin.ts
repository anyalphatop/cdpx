import { Command } from 'commander';
import { DouyinVideoDownloadLinkRunner } from '../runners/douyin/video.js';

const video = new Command('video').description('Douyin video operations');

video
  .command('get-download-link')
  .description('Get the MP4 download link for a Douyin video')
  .argument('<url>', 'Douyin share URL')
  .action(async (url: string) => {
    const result = await new DouyinVideoDownloadLinkRunner().run({ url });
    console.log(result.downloadUrl);
  });

const douyin = new Command('douyin').description('Douyin operations');
douyin.addCommand(video);

export { douyin };
