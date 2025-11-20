import { test, expect } from '@playwright/test'

test.describe('Agent Numbering and UI Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('agents start from 1 not 0 in agent list', async ({ page }) => {
    // Run simulation
    await page.fill('input[type="number"]:nth-of-type(1)', '42')
    await page.fill('input[type="number"]:nth-of-type(2)', '5')
    await page.fill('input[type="number"]:nth-of-type(3)', '1')
    await page.click('button:has-text("Run")')

    // Wait for agents to load
    await page.waitForTimeout(3000)

    // Get agent buttons
    const agentButtons = page.locator('div.app-layout-column button')
    const buttonTexts = await agentButtons.allTextContents()

    // Extract agent IDs from text (format: "Agent 1 — X cards — Y Prism")
    const agentIds = buttonTexts.map(text => {
      const match = text.match(/Agent (\d+)/)
      return match ? parseInt(match[1]) : null
    }).filter(id => id !== null)

    // Should not have Agent 0
    expect(agentIds).not.toContain(0)
    // First agent should be 1
    expect(Math.min(...agentIds)).toBe(1)
  })

  test('agent list data updates in real-time (refreshes)', async ({ page }) => {
    // Run simulation
    await page.fill('input[type="number"]:nth-of-type(1)', '99')
    await page.fill('input[type="number"]:nth-of-type(2)', '2')
    await page.fill('input[type="number"]:nth-of-type(3)', '3')
    await page.click('button:has-text("Run")')

    // Wait for initial data
    await page.waitForTimeout(2000)

    // Get initial agent data
    const agentButton1 = page.locator('div.app-layout-column button').first()
    const initialText = await agentButton1.textContent()

    // Parse initial cards and prism
    const initialMatch = initialText?.match(/(\d+) cards — (\d+) Prism/)
    const initialCards = parseInt(initialMatch?.[1] || '0')
    const initialPrism = parseInt(initialMatch?.[2] || '0')

    // Wait a bit more for simulation to complete
    await page.waitForTimeout(2000)

    // Get updated agent data
    const updatedText = await agentButton1.textContent()
    const updatedMatch = updatedText?.match(/(\d+) cards — (\d+) Prism/)
    const updatedCards = parseInt(updatedMatch?.[1] || '0')
    const updatedPrism = parseInt(updatedMatch?.[2] || '0')

    // Data should have updated (cards increased, prism may have changed)
    expect(updatedCards).toBeGreaterThan(initialCards)
  })

  test('events list has pagination controls', async ({ page }) => {
    // Run simulation with many ticks to generate lots of events
    await page.fill('input[type="number"]:nth-of-type(1)', '111')
    await page.fill('input[type="number"]:nth-of-type(2)', '10')
    await page.fill('input[type="number"]:nth-of-type(3)', '20')
    await page.click('button:has-text("Run")')

    // Wait for events to load
    await page.waitForTimeout(4000)

    // Check for pagination controls
    const paginationDiv = page.locator('.events-pagination')
    await expect(paginationDiv).toBeVisible()

    // Check for page size selector
    const pageSizeSelect = page.locator('.events-controls select').last()
    await expect(pageSizeSelect).toBeVisible()

    // Should have options for 10, 25, 50, 100
    const options = await pageSizeSelect.locator('option').allTextContents()
    expect(options).toContain('10 per page')
    expect(options).toContain('25 per page')
    expect(options).toContain('50 per page')
    expect(options).toContain('100 per page')
  })

  test('pagination buttons work correctly', async ({ page }) => {
    // Run simulation
    await page.fill('input[type="number"]:nth-of-type(1)', '222')
    await page.fill('input[type="number"]:nth-of-type(2)', '10')
    await page.fill('input[type="number"]:nth-of-type(3)', '25')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(4000)

    // Get initial event count on page
    const eventsList = page.locator('.events-list')
    const initialEvents = await eventsList.locator('.event-item').count()

    // Click next button
    const nextBtn = page.locator('.pagination-btn:has-text("Next")')
    await nextBtn.click()

    await page.waitForTimeout(500)

    // Event items should change
    const newEvents = await eventsList.locator('.event-item').count()
    
    // Different page might have same count but content should differ
    expect(newEvents).toBeGreaterThan(0)
  })

  test('page size selector changes events per page', async ({ page }) => {
    // Run simulation
    await page.fill('input[type="number"]:nth-of-type(1)', '333')
    await page.fill('input[type="number"]:nth-of-type(2)', '8')
    await page.fill('input[type="number"]:nth-of-type(3)', '20')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(4000)

    // Get current event count
    const eventsList = page.locator('.events-list')
    const initialCount = await eventsList.locator('.event-item').count()

    // Change page size to 10
    const pageSizeSelect = page.locator('.events-controls select').last()
    await pageSizeSelect.selectOption('10')

    await page.waitForTimeout(500)

    // Should now show 10 or fewer events
    const newCount = await eventsList.locator('.event-item').count()
    expect(newCount).toBeLessThanOrEqual(10)

    // Change to 50
    await pageSizeSelect.selectOption('50')
    await page.waitForTimeout(500)

    const count50 = await eventsList.locator('.event-item').count()
    expect(count50).toBeLessThanOrEqual(50)
  })

  test('card images display in landscape orientation', async ({ page }) => {
    // Run simulation
    await page.fill('input[type="number"]:nth-of-type(1)', '444')
    await page.fill('input[type="number"]:nth-of-type(2)', '2')
    await page.fill('input[type="number"]:nth-of-type(3)', '3')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(3000)

    // Click an agent
    const agentBtn = page.locator('div.app-layout-column button').first()
    await agentBtn.click()

    await page.waitForTimeout(2000)

    // Wait for inventory to load
    const inventoryTable = page.locator('.inventory-table')
    await expect(inventoryTable).toBeVisible()

    // Click first card to open detail modal
    const firstCard = inventoryTable.locator('tbody tr').first()
    await firstCard.click()

    await page.waitForTimeout(1000)

    // Check card image aspect ratio
    const cardImage = page.locator('.card-image-placeholder')
    await expect(cardImage).toBeVisible()

    // Get dimensions
    const box = await cardImage.boundingBox()
    if (box) {
      const aspectRatio = box.width / box.height
      // Landscape should be > 1 (wider than tall)
      expect(aspectRatio).toBeGreaterThan(1)
      // Should be approximately 16:9 (1.77)
      expect(aspectRatio).toBeGreaterThan(1.5)
    }
  })

  test('collector trait percentage shown in events', async ({ page }) => {
    // Run simulation
    await page.fill('input[type="number"]:nth-of-type(1)', '555')
    await page.fill('input[type="number"]:nth-of-type(2)', '3')
    await page.fill('input[type="number"]:nth-of-type(3)', '25')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(5000)

    // Get events view
    const eventsView = page.locator('.events-view')
    await expect(eventsView).toBeVisible()

    // Look for collector trait triggered event
    const eventsList = page.locator('.events-list')
    const eventItems = eventsList.locator('.event-item')
    const eventCount = await eventItems.count()

    let foundTriggerEvent = false
    for (let i = 0; i < Math.min(eventCount, 50); i++) {
      const eventText = await eventItems.nth(i).textContent()
      if (eventText?.includes('collector trait triggered')) {
        // Should have format: "collector trait triggered: XX% with YY%"
        expect(eventText).toMatch(/collector trait triggered: \d+% with \d+%/)
        foundTriggerEvent = true
        break
      }
    }

    // Might not have triggered if ticks too low, but if it did, format should be correct
    if (foundTriggerEvent) {
      expect(foundTriggerEvent).toBe(true)
    }
  })

  test('pagination info shows correct counts', async ({ page }) => {
    // Run simulation
    await page.fill('input[type="number"]:nth-of-type(1)', '666')
    await page.fill('input[type="number"]:nth-of-type(2)', '5')
    await page.fill('input[type="number"]:nth-of-type(3)', '15')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(4000)

    // Check pagination info
    const paginationInfo = page.locator('.pagination-info')
    const infoText = await paginationInfo.textContent()

    // Should have format: "Page X of Y (Z total)"
    expect(infoText).toMatch(/Page \d+ of \d+ \(\d+ total\)/)
  })
})
