/**
 * E2E tests for tick progression and reset functionality.
 */

import { test, expect } from '@playwright/test'

test.describe('Tick Progression & Reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('tick counter starts at 0', async ({ page }) => {
    // Check that the current tick is displayed and starts at 0
    const tickDisplay = page.locator('strong:has-text("Current Tick:")')
    await expect(tickDisplay).toContainText('Current Tick: 0')
  })

  test('running simulation increments tick counter', async ({ page }) => {
    // Set ticks to 3
    await page.fill('input[type="number"]:nth-of-type(3)', '3')
    
    // Initial tick should be 0
    await expect(page.locator('strong:has-text("Current Tick:")')).toContainText('Current Tick: 0')
    
    // Run simulation
    await page.click('button:has-text("Run")')
    
    // Wait for loading to finish
    await page.waitForTimeout(2000)
    
    // Tick should now be 3
    await expect(page.locator('strong:has-text("Current Tick:")')).toContainText('Current Tick: 3')
  })

  test('cannot run with negative ticks', async ({ page }) => {
    // Set ticks to -5
    await page.fill('input[type="number"]:nth-of-type(3)', '-5')
    
    // Try to run
    await page.click('button:has-text("Run")')
    
    // Should show alert
    await page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('Cannot move forward with negative ticks')
      dialog.dismiss()
    })
  })

  test('cannot run with zero ticks', async ({ page }) => {
    // Set ticks to 0
    await page.fill('input[type="number"]:nth-of-type(3)', '0')
    
    // Try to run
    await page.click('button:has-text("Run")')
    
    // Should show alert
    await page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('Please specify a positive number of ticks')
      dialog.dismiss()
    })
  })

  test('reset button clears data and resets tick to 0', async ({ page }) => {
    // Run simulation for 2 ticks
    await page.fill('input[type="number"]:nth-of-type(3)', '2')
    await page.click('button:has-text("Run")')
    
    // Wait for simulation
    await page.waitForTimeout(2000)
    
    // Verify tick is now 2
    await expect(page.locator('strong:has-text("Current Tick:")')).toContainText('Current Tick: 2')
    
    // Click reset button
    await page.click('button:has-text("Reset")')
    
    // Tick should be back to 0
    await expect(page.locator('strong:has-text("Current Tick:")')).toContainText('Current Tick: 0')
  })

  test('reset button disabled when tick is 0', async ({ page }) => {
    // Initially, reset button should be disabled
    const resetButton = page.locator('button:has-text("Reset")')
    await expect(resetButton).toBeDisabled()
  })

  test('incremental tick advancement works correctly', async ({ page }) => {
    // First run: advance 2 ticks
    await page.fill('input[type="number"]:nth-of-type(3)', '2')
    await page.click('button:has-text("Run")')
    await page.waitForTimeout(2000)
    
    // Tick should be 2
    await expect(page.locator('strong:has-text("Current Tick:")')).toContainText('Current Tick: 2')
    
    // Second run: advance 3 more ticks (should reach tick 5)
    await page.fill('input[type="number"]:nth-of-type(3)', '3')
    await page.click('button:has-text("Run")')
    await page.waitForTimeout(2000)
    
    // Tick should now be 5
    await expect(page.locator('strong:has-text("Current Tick:")')).toContainText('Current Tick: 5')
  })

  test('can run simulation again after reset', async ({ page }) => {
    // First run
    await page.fill('input[type="number"]:nth-of-type(3)', '1')
    await page.click('button:has-text("Run")')
    await page.waitForTimeout(2000)
    
    // Verify tick is 1
    await expect(page.locator('strong:has-text("Current Tick:")')).toContainText('Current Tick: 1')
    
    // Reset
    await page.click('button:has-text("Reset")')
    
    // Verify tick is back to 0
    await expect(page.locator('strong:has-text("Current Tick:")')).toContainText('Current Tick: 0')
    
    // Run again
    await page.fill('input[type="number"]:nth-of-type(3)', '2')
    await page.click('button:has-text("Run")')
    await page.waitForTimeout(2000)
    
    // Tick should be 2
    await expect(page.locator('strong:has-text("Current Tick:")')).toContainText('Current Tick: 2')
  })
})
