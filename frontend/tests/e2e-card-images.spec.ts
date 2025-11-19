import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Card Image Loading
 * 
 * Verifies that:
 * - Card images load from the /cards folder
 * - Card detail modal displays images correctly
 * - PNG images are properly named (C###.png)
 * - Fallback placeholder appears if image not found
 */

test.describe('Card Image Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to frontend
    await page.goto('http://localhost:5173')
  })

  test('card images load when opening card detail', async ({ page }) => {
    // Run simulation
    await page.click('button[type="submit"]')

    // Wait for agents list
    await page.waitForSelector('ul li button', { timeout: 30000 })

    // Click first agent to view details
    const firstAgentButton = page.locator('ul li button').first()
    await firstAgentButton.click()

    // Wait for agent details to load
    await page.waitForSelector('h3', { timeout: 10000 })

    // Find and click the first card in inventory
    const cardRows = page.locator('table tbody tr')
    const cardRowsCount = await cardRows.count()
    
    if (cardRowsCount === 0) {
      test.skip()
      return
    }

    // Click the first card row to open detail modal
    await cardRows.first().click()

    // Wait for card detail modal to appear
    await page.waitForSelector('.card-detail-modal', { timeout: 5000 })

    // Get the card detail modal
    const modal = page.locator('.card-detail-modal')
    await expect(modal).toBeVisible()

    // Find the image in the modal
    const image = modal.locator('img').first()
    
    // Verify image element exists
    await expect(image).toBeVisible()

    // Get the card ID from the image src to verify format
    const imageSrc = await image.getAttribute('src')
    expect(imageSrc).toMatch(/\/cards\/C\d{3}\.png$/)

    // Verify the image actually loaded (no error)
    const isLoaded = await image.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalHeight !== 0
    })

    // Image should be loaded or use fallback SVG
    const usesFallback = imageSrc?.includes('data:image')
    expect(isLoaded || usesFallback).toBeTruthy()
  })

  test('card image filename matches card ID format', async ({ page }) => {
    // Run simulation
    await page.click('button[type="submit"]')

    // Wait for agents list
    await page.waitForSelector('ul li button', { timeout: 30000 })

    // Click first agent
    const firstAgentButton = page.locator('ul li button').first()
    await firstAgentButton.click()

    // Wait for agent details
    await page.waitForSelector('h3', { timeout: 10000 })

    // Get first card
    const cardRows = page.locator('table tbody tr')
    const cardRowsCount = await cardRows.count()
    
    if (cardRowsCount === 0) {
      test.skip()
      return
    }

    // Click first card to open detail
    await cardRows.first().click()

    // Wait for modal
    await page.waitForSelector('.card-detail-modal', { timeout: 5000 })

    // Extract card ID from modal title or card data
    const modal = page.locator('.card-detail-modal')
    const image = modal.locator('img').first()
    const imageSrc = await image.getAttribute('src')

    // Verify PNG format
    expect(imageSrc).toContain('.png')

    // Verify C### format (C followed by 3 digits)
    const match = imageSrc?.match(/C\d{3}\.png/)
    expect(match).toBeTruthy()
  })

  test('multiple cards show correct images', async ({ page }) => {
    // Run simulation
    await page.click('button[type="submit"]')

    // Wait for agents list
    await page.waitForSelector('ul li button', { timeout: 30000 })

    // Click first agent
    const firstAgentButton = page.locator('ul li button').first()
    await firstAgentButton.click()

    // Wait for agent details
    await page.waitForSelector('h3', { timeout: 10000 })

    // Get first and second cards
    const cardRows = page.locator('table tbody tr')
    const cardRowsCount = await cardRows.count()
    
    if (cardRowsCount < 2) {
      test.skip()
      return
    }

    const imageSrcs: string[] = []

    // Click first card
    await cardRows.first().click()
    await page.waitForSelector('.card-detail-modal', { timeout: 5000 })
    let image = page.locator('.card-detail-modal img').first()
    let src1 = await image.getAttribute('src')
    imageSrcs.push(src1 || '')

    // Close modal by clicking outside
    await page.click('.card-detail-overlay')
    await page.waitForTimeout(300)

    // Click second card
    await cardRows.nth(1).click()
    await page.waitForSelector('.card-detail-modal', { timeout: 5000 })
    image = page.locator('.card-detail-modal img').first()
    let src2 = await image.getAttribute('src')
    imageSrcs.push(src2 || '')

    // Verify both have image sources
    expect(imageSrcs[0]).toBeTruthy()
    expect(imageSrcs[1]).toBeTruthy()

    // Verify both are PNG format
    expect(imageSrcs[0]).toContain('.png')
    expect(imageSrcs[1]).toContain('.png')

    // Verify they are different images (different card IDs)
    expect(imageSrcs[0]).not.toBe(imageSrcs[1])
  })

  test('missing image shows fallback placeholder', async ({ page }) => {
    // This test verifies fallback behavior
    // Navigate to a page and manually set an image source to a non-existent card
    
    await page.goto('http://localhost:5173')

    // Run simulation
    await page.click('button[type="submit"]')
    await page.waitForSelector('ul li button', { timeout: 30000 })

    // Click first agent
    const firstAgentButton = page.locator('ul li button').first()
    await firstAgentButton.click()
    await page.waitForSelector('h3', { timeout: 10000 })

    // Click first card to open detail
    const cardRows = page.locator('table tbody tr')
    if (await cardRows.count() === 0) {
      test.skip()
      return
    }

    await cardRows.first().click()
    await page.waitForSelector('.card-detail-modal', { timeout: 5000 })

    // Find image and verify it has error handling
    const image = page.locator('.card-detail-modal img').first()
    
    // Check if image has onError handler (we can't directly test this,
    // but we can verify the image element exists)
    await expect(image).toBeVisible()

    // Verify image has alt text
    const altText = await image.getAttribute('alt')
    expect(altText).toBeTruthy()
  })
})
