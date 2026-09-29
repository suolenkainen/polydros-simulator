import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    // Start backend
    {
      command: 'python -m uvicorn backend.main:app --reload --port 8420',
      port: 8420,
      cwd: '..',
      reuseExistingServer: true,
    },
    // Start frontend (vite) on fixed port
    {
      command: 'npm run dev -- --port 5420',
      port: 5420,
      cwd: '.',
      reuseExistingServer: true,
    },
  ],
})
