import { test, expect } from 'vitest';
import { cdpx } from '../src/sdk.js';

test('douyin video get-download-link', async () => {
  const result = await cdpx.douyin.video.getDownloadLink({
    url: 'https://v.douyin.com/e57Hz45rJrA/',
  });

  expect(result.link).toMatch(/^https:\/\//);
});
