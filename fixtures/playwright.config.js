import { defineConfig, devices } from '@playwright/test';

const PORT = 4180;

export default defineConfig({
  testDir: '.',
  testMatch: 'smoke.spec.js',
  reporter: 'list',
  outputDir: `test-results/${process.env.SMOKE_NAME || 'smoke'}`,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    viewport: { width: 1000, height: 700 },
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: `node serve.mjs "${process.env.SMOKE_DIR}" ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
  },
});
