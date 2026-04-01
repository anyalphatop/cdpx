export const config = {
  cdp: {
    host: process.env.CDPX_HOST ?? 'localhost',
    port: parseInt(process.env.CDPX_PORT ?? '9222', 10),
    timeout: parseInt(process.env.CDPX_TIMEOUT ?? '5000', 10),
    pollInterval: parseInt(process.env.CDPX_POLL_INTERVAL ?? '100', 10),
    readyTimeout: parseInt(process.env.CDPX_READY_TIMEOUT ?? '180000', 10),
    copyDelay: parseInt(process.env.CDPX_COPY_DELAY ?? '600', 10),
    networkIdleWindow: parseInt(process.env.CDPX_NETWORK_IDLE_WINDOW ?? '500', 10),
    scrollStep: parseInt(process.env.CDPX_SCROLL_STEP ?? '800', 10),
    scrollInterval: parseInt(process.env.CDPX_SCROLL_INTERVAL ?? '1000', 10),
    scrollStableThreshold: parseInt(process.env.CDPX_SCROLL_STABLE_THRESHOLD ?? '3', 10),
  },
};
