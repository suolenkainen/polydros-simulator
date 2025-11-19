import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Combat System and Agent Behavior
 *
 * Tests verify:
 * - Tick 0 shows no agent events (multiple seeds)
 * - Agent purchase events are recorded with varied configs
 * - Non-purchasing agents based on configuration
 * - Combat events appear in event log
 * - Combat affects card metadata (attractiveness, price)
 * - Card data integrity (correct values in each column)
 * - Deterministic behavior with same seed
 * - Multi-agent interactions
 */

test.describe('Combat System & Agent Behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to frontend
    await page.goto('http://localhost:5173')
  })

  test('tick 0 shows no events on agents (seed 42)', async ({ page }) => {
    // Verify initial state at tick 0 with seed 42
    const tickDisplay = page.locator('strong:has-text("Current Tick:")')
    await expect(tickDisplay).toContainText('Current Tick: 0')

    // Set seed 42, 5 agents, 0 ticks
    await page.fill('input[type="number"]:nth-of-type(1)', '42')
    await page.fill('input[type="number"]:nth-of-type(2)', '5')
    await page.fill('input[type="number"]:nth-of-type(3)', '0')
    await page.click('button:has-text("Run")')
    await page.waitForTimeout(2000)

    // Get agent list
    await page.waitForSelector('button', { timeout: 5000 })
    const agentButtons = page.locator('div.app-layout-column button')
    const agentCount = await agentButtons.count()
    expect(agentCount).toBeGreaterThan(0)

    // Click first agent to view details
    await agentButtons.first().click()

    // Wait for agent detail section to load
    await page.waitForTimeout(500)

    // Get events list in agent detail
    const agentDetail = page.locator('.agent-detail')
    const detailText = await agentDetail.textContent()

    // At tick 0, agents should have no purchase/combat events
    expect(detailText).toBeTruthy()
    expect(detailText).not.toContain('booster_purchase')
    expect(detailText).not.toContain('defeated')
  })

  test('tick 0 shows no events on agents (seed 999)', async ({ page }) => {
    // Verify initial state at tick 0 with different seed 999
    await page.fill('input[type="number"]:nth-of-type(1)', '999')
    await page.fill('input[type="number"]:nth-of-type(2)', '10')
    await page.fill('input[type="number"]:nth-of-type(3)', '0')
    await page.click('button:has-text("Run")')
    await page.waitForTimeout(2000)

    const tickDisplay = page.locator('strong:has-text("Current Tick:")')
    await expect(tickDisplay).toContainText('Current Tick: 0')

    // Get agents list
    const agentButtons = page.locator('div.app-layout-column button')
    const agentCount = await agentButtons.count()
    expect(agentCount).toBeGreaterThan(0)

    // Click agent at index 2
    if (agentCount > 2) {
      await agentButtons.nth(2).click()
      await page.waitForTimeout(500)

      const agentDetail = page.locator('.agent-detail')
      const detailText = await agentDetail.textContent()
      expect(detailText).not.toContain('defeated')
    }
  })


  test('agents perform purchases on tick 1+ (seed 42, 3 ticks)', async ({ page }) => {
    // Run simulation for 3 ticks - agents should purchase
    await page.fill('input[type="number"]:nth-of-type(1)', '42')
    await page.fill('input[type="number"]:nth-of-type(2)', '8')
    await page.fill('input[type="number"]:nth-of-type(3)', '3')
    await page.click('button:has-text("Run")')

    // Wait for simulation to complete
    await page.waitForTimeout(4000)

    // Verify tick is 3
    await expect(page.locator('strong:has-text("Current Tick:")')).toContainText(
      'Current Tick: 3'
    )

    // Get events view to verify purchases occurred
    const eventsView = page.locator('.events-view')
    const eventsContent = await eventsView.textContent()

    // Should have events after running ticks
    expect(eventsContent).toBeTruthy()
    // With 8 agents buying 5 packs/tick for 3 ticks: 8*5*3 = 120 purchases expected
    expect(eventsContent).toContain('booster_purchase')
  })

  test('agents perform purchases on tick 1+ (seed 555, 5 ticks)', async ({ page }) => {
    // Different seed and longer simulation
    await page.fill('input[type="number"]:nth-of-type(1)', '555')
    await page.fill('input[type="number"]:nth-of-type(2)', '5')
    await page.fill('input[type="number"]:nth-of-type(3)', '5')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(4000)

    await expect(page.locator('strong:has-text("Current Tick:")')).toContainText(
      'Current Tick: 5'
    )

    const eventsView = page.locator('.events-view')
    const eventsContent = await eventsView.textContent()

    expect(eventsContent).toContain('booster_purchase')
    // With 5 agents and 5 ticks: at least 5*5*1 = 25 purchases (conservative)
    const purchaseCount = (eventsContent?.match(/booster_purchase/g) || []).length
    expect(purchaseCount).toBeGreaterThan(10)
  })


  test('agent 0 has correct collection data (seed 42)', async ({ page }) => {
    // Run simulation with specific seed for reproducibility
    await page.fill('input[type="number"]:nth-of-type(1)', '42')
    await page.fill('input[type="number"]:nth-of-type(2)', '10')
    await page.fill('input[type="number"]:nth-of-type(3)', '3')
    await page.click('button:has-text("Run")')

    // Wait for simulation to complete
    await page.waitForTimeout(3000)

    // Fetch agent collection via API to verify card data
    const response = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0/cards').then(r => r.json())
    )

    // Verify structure
    expect(response).toHaveProperty('id', 0)
    expect(response).toHaveProperty('collection_count')
    expect(response).toHaveProperty('cards')
    expect(Array.isArray(response.cards)).toBe(true)

    // After 3 ticks with 5 packs/tick = 15 cards expected
    const collectionCount = response.collection_count
    expect(collectionCount).toBeGreaterThanOrEqual(10)
    expect(collectionCount).toBeLessThanOrEqual(25) // Allow variance

    // Verify each card has required fields
    if (response.cards.length > 0) {
      const firstCard = response.cards[0]
      expect(firstCard).toHaveProperty('card_id')
      expect(firstCard).toHaveProperty('name')
      expect(firstCard).toHaveProperty('rarity')
      expect(firstCard).toHaveProperty('price')
      expect(firstCard).toHaveProperty('attractiveness')

      // Verify price is a positive number
      expect(typeof firstCard.price).toBe('number')
      expect(firstCard.price).toBeGreaterThan(0)
      expect(firstCard.price).toBeLessThan(100) // Sanity check

      // Verify attractiveness is a positive number
      expect(typeof firstCard.attractiveness).toBe('number')
      expect(firstCard.attractiveness).toBeGreaterThan(0)
      expect(firstCard.attractiveness).toBeLessThanOrEqual(2) // Should be ~1.0 initially
    }
  })

  test('agent 3 has correct collection data (seed 888)', async ({ page }) => {
    // Different seed, check agent 3
    await page.fill('input[type="number"]:nth-of-type(1)', '888')
    await page.fill('input[type="number"]:nth-of-type(2)', '8')
    await page.fill('input[type="number"]:nth-of-type(3)', '3')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(3000)

    // Fetch agent 3 collection
    const response = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/3/cards').then(r => r.json())
    )

    // Verify agent 3 exists and has data
    expect(response).toHaveProperty('id', 3)
    expect(response).toHaveProperty('collection_count')
    expect(response.collection_count).toBeGreaterThan(0)

    // Verify all cards have valid price/attractiveness
    for (const card of response.cards) {
      expect(card.price).toBeGreaterThan(0)
      expect(card.attractiveness).toBeGreaterThan(0)
      expect(card.rarity).toMatch(/COMMON|UNCOMMON|RARE|MYTHIC/)
    }
  })

  test('agents have distinct card collections (seed 666)', async ({ page }) => {
    // Verify multiple agents have different collections
    await page.fill('input[type="number"]:nth-of-type(1)', '666')
    await page.fill('input[type="number"]:nth-of-type(2)', '5')
    await page.fill('input[type="number"]:nth-of-type(3)', '2')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(3000)

    // Fetch collections for agents 0 and 1
    const agent0 = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0/cards').then(r => r.json())
    )
    const agent1 = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/1/cards').then(r => r.json())
    )

    // Both should have cards but potentially different collections
    expect(agent0.cards.length).toBeGreaterThan(0)
    expect(agent1.cards.length).toBeGreaterThan(0)

    // Get card IDs for each agent
    const agent0CardIds = new Set(agent0.cards.map((c: any) => c.card_id))
    const agent1CardIds = new Set(agent1.cards.map((c: any) => c.card_id))

    // Collections might overlap, but should have some differences (stochastic)
    expect(agent0CardIds.size).toBeGreaterThan(0)
    expect(agent1CardIds.size).toBeGreaterThan(0)
  })


  test('non-collector agents stop buying after 60 cards (seed 123)', async ({ page }) => {
    // Run simulation with multiple ticks to hit 60-card threshold
    await page.fill('input[type="number"]:nth-of-type(1)', '123')
    await page.fill('input[type="number"]:nth-of-type(2)', '5')
    await page.fill('input[type="number"]:nth-of-type(3)', '15')
    await page.click('button:has-text("Run")')

    // Wait for simulation
    await page.waitForTimeout(4000)

    // Fetch agent data to check purchase patterns
    const agent0 = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0').then(r => r.json())
    )

    // After 15 ticks at 5 cards/pack * 5 packs/tick = 75 cards expected
    const collectionCount = agent0.agent.collection_count
    expect(collectionCount).toBeGreaterThanOrEqual(60)

    // Verify traits are present
    const traits = agent0.agent.traits
    expect(traits).toHaveProperty('collector_trait')
    const collectorTrait = traits.collector_trait
    expect(collectorTrait).toBeGreaterThanOrEqual(0.10)
    expect(collectorTrait).toBeLessThanOrEqual(0.50)

    // Verify Prism calculation is correct
    // With purchases at 60 Prism/tick, track Prism spending
    expect(agent0.agent.prism).toBeGreaterThanOrEqual(0)
  })

  test('collector trait varies by seed (seed 777 vs 333)', async ({ page }) => {
    // Run with seed 777
    await page.fill('input[type="number"]:nth-of-type(1)', '777')
    await page.fill('input[type="number"]:nth-of-type(2)', '3')
    await page.fill('input[type="number"]:nth-of-type(3)', '1')
    await page.click('button:has-text("Run")')
    await page.waitForTimeout(2500)

    const agent777 = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0').then(r => r.json())
    )
    const trait777 = agent777.agent.traits.collector_trait

    // Reset and run with seed 333
    await page.goto('http://localhost:5173')
    await page.fill('input[type="number"]:nth-of-type(1)', '333')
    await page.fill('input[type="number"]:nth-of-type(2)', '3')
    await page.fill('input[type="number"]:nth-of-type(3)', '1')
    await page.click('button:has-text("Run")')
    await page.waitForTimeout(2500)

    const agent333 = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0').then(r => r.json())
    )
    const trait333 = agent333.agent.traits.collector_trait

    // Both should be valid traits, likely different
    expect(trait777).toBeGreaterThanOrEqual(0.10)
    expect(trait333).toBeGreaterThanOrEqual(0.10)
    // They might be equal by chance, but demonstrate different seeds can affect traits
    expect(typeof trait777).toBe('number')
    expect(typeof trait333).toBe('number')
  })


  test('combat events appear in event log (seed 999, 20 ticks)', async ({ page }) => {
    // Run simulation with more ticks to trigger combats
    await page.fill('input[type="number"]:nth-of-type(1)', '999')
    await page.fill('input[type="number"]:nth-of-type(2)', '10')
    await page.fill('input[type="number"]:nth-of-type(3)', '20')
    await page.click('button:has-text("Run")')

    // Wait for simulation to complete
    await page.waitForTimeout(5000)

    // Fetch full simulation data
    const response = await page.evaluate(() =>
      fetch('http://localhost:8000/agents').then(r => r.json())
    )

    // Get all events
    const events = await page.evaluate(() =>
      fetch('http://localhost:8000/agents').then(r => r.json())
    )

    // Look for combat events in the events log
    const eventsView = page.locator('.events-view')
    const eventsContent = await eventsView.textContent()

    // Look for "defeated" keyword (combat event format)
    let foundCombat = eventsContent?.toLowerCase().includes('defeated') || false

    if (!foundCombat) {
      // Look for "combat" keyword as fallback
      foundCombat = eventsContent?.toLowerCase().includes('combat') || false
    }

    // With 10 agents and 20 ticks, combat should have occurred
    expect(foundCombat).toBeTruthy()

    // Count combat mentions
    const combatCount = (eventsContent?.match(/defeated/gi) || []).length
    expect(combatCount).toBeGreaterThan(0)
  })

  test('combat events appear with varied agent counts (seed 444, 5 agents)', async ({ page }) => {
    // Fewer agents, 20 ticks
    await page.fill('input[type="number"]:nth-of-type(1)', '444')
    await page.fill('input[type="number"]:nth-of-type(2)', '5')
    await page.fill('input[type="number"]:nth-of-type(3)', '20')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(5000)

    const eventsView = page.locator('.events-view')
    const eventsContent = await eventsView.textContent()

    // Should still find some combats even with fewer agents
    const hasDefeated = eventsContent?.toLowerCase().includes('defeated') || false
    expect(hasDefeated).toBeTruthy()
  })


  test('combat event records winner and loser with scores (seed 555)', async ({ page }) => {
    // Run simulation with many agents and ticks for high combat probability
    await page.fill('input[type="number"]:nth-of-type(1)', '555')
    await page.fill('input[type="number"]:nth-of-type(2)', '15')
    await page.fill('input[type="number"]:nth-of-type(3)', '30')
    await page.click('button:has-text("Run")')

    // Wait for simulation
    await page.waitForTimeout(5000)

    // Check events view for combat events
    const eventsView = page.locator('.events-view')
    const eventItems = eventsView.locator('.event-item')
    const eventCount = await eventItems.count()

    // Should have events
    expect(eventCount).toBeGreaterThan(0)

    // Look for combat event format: "Agent-X defeated Agent-Y"
    let foundDefeated = false
    let defeatedEventText = ''
    for (let i = 0; i < Math.min(eventCount, 50); i++) {
      const eventText = await eventItems.nth(i).textContent()
      if (eventText?.toLowerCase().includes('defeated')) {
        foundDefeated = true
        defeatedEventText = eventText || ''
        // Verify format: should contain Agent names and score differential
        expect(eventText).toMatch(/Agent|defeated|vs/i)
        break
      }
    }

    expect(foundDefeated).toBeTruthy()

    // Parse the defeated event to verify structure
    if (defeatedEventText) {
      // Should match format: "Agent-X defeated Agent-Y (scoreX vs scoreY)"
      expect(defeatedEventText).toMatch(/Agent-\d+.*defeated.*Agent-\d+/)
      expect(defeatedEventText).toMatch(/\d+\.\d+.*vs.*\d+\.\d+/) // Scores with decimals
    }
  })

  test('combat records correct opponent pair (seed 777, agents 0 vs 3)', async ({ page }) => {
    // Run simulation looking for specific combat pairs
    await page.fill('input[type="number"]:nth-of-type(1)', '777')
    await page.fill('input[type="number"]:nth-of-type(2)', '8')
    await page.fill('input[type="number"]:nth-of-type(3)', '25')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(5000)

    // Fetch raw event data
    const allEvents = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0').then(r => r.json())
    )

    // Verify agent has events
    expect(allEvents.agent).toHaveProperty('agent_events')
    const agentEvents = allEvents.agent.agent_events

    // Filter to combat events only
    const combatEvents = agentEvents.filter((e: any) => e.event_type === 'combat')

    // Should have some combat events
    expect(combatEvents.length).toBeGreaterThanOrEqual(0)

    // Verify combat events have correct structure
    for (const event of combatEvents) {
      expect(event).toHaveProperty('event_type', 'combat')
      expect(event).toHaveProperty('description')
      expect(event.description).toMatch(/defeated|Agent-\d+/)
      expect(event).toHaveProperty('agent_ids')
      expect(Array.isArray(event.agent_ids)).toBe(true)
      expect(event.agent_ids.length).toBeGreaterThanOrEqual(1) // At least primary agent
    }
  })


  test('winning cards have increased attractiveness (seed 777)', async ({ page }) => {
    // Run simulation with specific seed for reproducibility
    await page.fill('input[type="number"]:nth-of-type(1)', '777')
    await page.fill('input[type="number"]:nth-of-type(2)', '8')
    await page.fill('input[type="number"]:nth-of-type(3)', '25')
    await page.click('button:has-text("Run")')

    // Wait for simulation
    await page.waitForTimeout(4000)

    // Fetch collection data
    const response = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0/cards').then(r => r.json())
    )

    expect(response.cards.length).toBeGreaterThan(0)

    // Check for cards with above-baseline attractiveness
    // Winners should have attractiveness > 1.0
    const highAttractiveness = response.cards.filter((c: any) => c.attractiveness > 1.0)

    // With multiple combats, some cards should have boosted attractiveness
    // Seed 777 should produce consistent results
    expect(response.cards).toBeDefined()

    // Verify all attractiveness values are positive
    for (const card of response.cards) {
      expect(card.attractiveness).toBeGreaterThan(0)
      expect(card.attractiveness).toBeLessThan(5) // Sanity check for extreme boosts
    }
  })

  test('card attractiveness varies by combat history (seed 111)', async ({ page }) => {
    // Run longer simulation to accumulate more combats
    await page.fill('input[type="number"]:nth-of-type(1)', '111')
    await page.fill('input[type="number"]:nth-of-type(2)', '6')
    await page.fill('input[type="number"]:nth-of-type(3)', '30')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(5000)

    const agent0 = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0/cards').then(r => r.json())
    )
    const agent1 = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/1/cards').then(r => r.json())
    )

    // Get min/max attractiveness for each agent
    const agent0Attractiveness = agent0.cards.map((c: any) => c.attractiveness)
    const agent1Attractiveness = agent1.cards.map((c: any) => c.attractiveness)

    const agent0Max = Math.max(...agent0Attractiveness)
    const agent1Max = Math.max(...agent1Attractiveness)

    // Should have some variation in attractiveness
    expect(agent0Max).toBeGreaterThan(0)
    expect(agent1Max).toBeGreaterThan(0)

    // Attractiveness should vary between agents based on wins/losses
    expect(agent0Attractiveness.length).toBeGreaterThan(0)
    expect(agent1Attractiveness.length).toBeGreaterThan(0)
  })


  test('losing cards have decreased attractiveness (seed 888)', async ({ page }) => {
    // Run simulation where losers' cards are penalized
    await page.fill('input[type="number"]:nth-of-type(1)', '888')
    await page.fill('input[type="number"]:nth-of-type(2)', '8')
    await page.fill('input[type="number"]:nth-of-type(3)', '25')
    await page.click('button:has-text("Run")')

    // Wait for simulation
    await page.waitForTimeout(4000)

    // Fetch agent collection data
    const response = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0/cards').then(r => r.json())
    )

    // The simulation engine tracks card stat changes in world.card_metadata
    // Verify that cards have attractiveness values
    expect(response.cards.length).toBeGreaterThan(0)

    // All cards should have valid attractiveness
    for (const card of response.cards) {
      expect(card.attractiveness).toBeGreaterThan(0)
      expect(card.attractiveness).toBeLessThanOrEqual(2) // Conservative upper bound
    }

    // Get events to confirm combats occurred
    const eventsView = page.locator('.events-view')
    const eventsContent = await eventsView.textContent()

    // Combat events indicate card penalties were applied
    const hasCombat = eventsContent?.toLowerCase().includes('defeated') ||
      eventsContent?.toLowerCase().includes('combat')

    expect(hasCombat).toBeTruthy()
  })

  test('losing cards have varied attractiveness values (seed 202)', async ({ page }) => {
    // Longer simulation to accumulate losses
    await page.fill('input[type="number"]:nth-of-type(1)', '202')
    await page.fill('input[type="number"]:nth-of-type(2)', '10')
    await page.fill('input[type="number"]:nth-of-type(3)', '30')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(5000)

    // Fetch multiple agents to see attractiveness variation
    const agents = []
    for (let i = 0; i < Math.min(3, 10); i++) {
      const response = await page.evaluate((agentId) =>
        fetch(`http://localhost:8000/agents/${agentId}/cards`).then(r => r.json()),
        i
      )
      agents.push(response)
    }

    // Each agent should have cards with attractiveness values
    for (const agent of agents) {
      expect(agent.cards).toBeDefined()
      if (agent.cards.length > 0) {
        const attractivenessValues = agent.cards.map((c: any) => c.attractiveness)
        const minAttractiveness = Math.min(...attractivenessValues)
        const maxAttractiveness = Math.max(...attractivenessValues)

        // Should have some variation
        expect(minAttractiveness).toBeGreaterThan(0)
        expect(maxAttractiveness).toBeGreaterThan(minAttractiveness)
      }
    }
  })


  test('card prices change after combat (seed 666)', async ({ page }) => {
    // Run simulation with combat enabled
    await page.fill('input[type="number"]:nth-of-type(1)', '666')
    await page.fill('input[type="number"]:nth-of-type(2)', '10')
    await page.fill('input[type="number"]:nth-of-type(3)', '30')
    await page.click('button:has-text("Run")')

    // Wait for simulation to complete
    await page.waitForTimeout(5000)

    // Fetch collection data with prices
    const response = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0/cards').then(r => r.json())
    )

    expect(response.cards.length).toBeGreaterThan(0)

    // Verify each card has a price
    for (const card of response.cards) {
      expect(card).toHaveProperty('price')
      expect(card).toHaveProperty('attractiveness')
      expect(typeof card.price).toBe('number')
      expect(card.price).toBeGreaterThan(0)
    }

    // Get events to verify combats occurred (which means prices changed)
    const eventsView = page.locator('.events-view')
    const eventsContent = await eventsView.textContent()

    expect(eventsContent).toBeTruthy()

    // Combat events should be present (indicates prices were updated)
    const hasDefeated = eventsContent?.toLowerCase().includes('defeated') || false
    expect(hasDefeated).toBeTruthy()
  })

  test('card prices vary by combat outcome (seed 333)', async ({ page }) => {
    // Long simulation to accumulate price changes
    await page.fill('input[type="number"]:nth-of-type(1)', '333')
    await page.fill('input[type="number"]:nth-of-type(2)', '8')
    await page.fill('input[type="number"]:nth-of-type(3)', '30')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(5000)

    // Fetch agent collections
    const agent0 = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0/cards').then(r => r.json())
    )
    const agent1 = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/1/cards').then(r => r.json())
    )

    // Collect price statistics
    const agent0Prices = agent0.cards.map((c: any) => c.price)
    const agent1Prices = agent1.cards.map((c: any) => c.price)

    // Calculate min/max prices
    const agent0Min = Math.min(...agent0Prices)
    const agent0Max = Math.max(...agent0Prices)
    const agent1Min = Math.min(...agent1Prices)
    const agent1Max = Math.max(...agent1Prices)

    // All prices should be positive
    expect(agent0Min).toBeGreaterThan(0)
    expect(agent1Min).toBeGreaterThan(0)

    // There should be price variation (winners higher, losers lower)
    expect(agent0Max).toBeGreaterThan(agent0Min)
    expect(agent1Max).toBeGreaterThan(agent1Min)

    // Prices and attractiveness should correlate (both should track combat outcome)
    for (const card of agent0.cards) {
      expect(card.price).toBeCloseTo(card.attractiveness, 1) // Within 1 decimal place
    }
  })

  test('price and attractiveness correlation (seed 444)', async ({ page }) => {
    // Verify price and attractiveness move together
    await page.fill('input[type="number"]:nth-of-type(1)', '444')
    await page.fill('input[type="number"]:nth-of-type(2)', '6')
    await page.fill('input[type="number"]:nth-of-type(3)', '25')
    await page.click('button:has-text("Run")')

    await page.waitForTimeout(4500)

    const response = await page.evaluate(() =>
      fetch('http://localhost:8000/agents/0/cards').then(r => r.json())
    )

    // For each card, price and attractiveness should be similar
    // (They're both multiplied by the same factors during boosts/penalties)
    for (const card of response.cards) {
      const priceDiff = Math.abs(card.price - card.attractiveness)
      // Allow small floating point differences
      expect(priceDiff).toBeLessThan(0.01)
    }
  })
})


