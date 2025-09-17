// @ts-check
import { defineConfig, devices } from '@playwright/test';

// Use Playwright-downloaded browsers for fidelity across environments.
// - Mobile Chrome: Chromium with Pixel 5 profile
// - Mobile Safari: optionally enabled when underlying WebKit supports mobile emulation
const projects = [
  {
    name: 'Mobile Chrome',
    use: {
      ...devices['Pixel 5'],
      browserName: 'chromium',
    },
  },
];

if (process.env.PLAYWRIGHT_INCLUDE_MOBILE_SAFARI === '1') {
  projects.push({
    name: 'Mobile Safari (WebKit)',
    use: {
      browserName: 'webkit',
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    },
  });
} else {
  console.warn('[playwright] Skipping Mobile Safari project – set PLAYWRIGHT_INCLUDE_MOBILE_SAFARI=1 to enable.');
}

projects.push({
  name: 'Mobile Firefox',
  use: {
    browserName: 'firefox',
    viewport: { width: 393, height: 852 }, // iPhone 12 viewport-like
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/35.0 Mobile/15E148 Safari/605.1.15',
    deviceScaleFactor: 3,
    hasTouch: true,
  },
});

const previewHost = process.env.PREVIEW_HOST || '127.0.0.1';
const previewPort = Number(process.env.PREVIEW_PORT || 5173);
const derivedBaseURL = `http://${previewHost}:${previewPort}`;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || derivedBaseURL;

export default defineConfig({
  testDir: 'src/__tests__/e2e',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    headless: true,
  },
  webServer: process.env.SKIP_WEB_SERVER === '1' ? undefined : {
    command: `vite preview --host ${previewHost} --port ${previewPort} --strictPort`,
    url: baseURL,
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  projects,
});
