export const config = {
  cdp: {
    host: process.env.CDPX_HOST ?? 'localhost',
    port: parseInt(process.env.CDPX_PORT ?? '9222', 10),
    timeout: parseInt(process.env.CDPX_TIMEOUT ?? '5000', 10),
  },
};
