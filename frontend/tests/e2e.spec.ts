import { test, expect } from '@playwright/test'

// E2E: Run a small simulation via the UI, ensure agent list populates and
// agent details render.

test('run simulation and view agent', async ({ page }) => {
  // Navigate to the frontend served by the webServer config
  await page.goto('http://localhost:5173')

  // Click the Run button (submit form)
  await page.click('button[type="submit"]')

  // Wait for agents list to populate (buttons in the AgentList)
  await page.waitForSelector('ul li button', { timeout: 15000 })

  // Click the first agent
  const firstAgent = await page.locator('ul li button').first()
  const label = await firstAgent.innerText()
  await firstAgent.click()

  // Wait for agent detail to show
  await page.waitForSelector('h3')
  const header = await page.locator('h3').innerText()
  expect(header).toContain('Agent')

  // Verify sample cards list exists (may be empty)
  expect(await page.locator('h4')).toHaveText('Sample cards')
})
