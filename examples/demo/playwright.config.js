import { defineConfig, devices } from '@playwright/test';

// E2E_PORT lets several runs (e.g. mapbox and maplibre builds) coexist on one machine.
const PORT = Number(process.env.E2E_PORT || 4173);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1000, height: 700 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1000, height: 700 },
        // Software WebGL so the map renders on CI machines without a GPU.
        launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
      },
    },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    port: PORT,
    // Always start our own build: reusing whatever listens on the port can silently test a
    // different checkout (e.g. another git worktree). A busy port fails loudly instead.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
