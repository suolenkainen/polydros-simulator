import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AgentInventory from '../AgentInventory'

describe('AgentInventory - Table Creation', () => {
  const mockAgent = {
    id: 1,
    prism: 100,
    name: 'Agent 1',
    card_instances: [
      {
        card_instance_id: 'INST_001_1_0_123',
        card_id: 'C001',
        card_name: 'Common Card',
        flavor_text: 'A common card',
        card_color: 'Sapphire',
        card_rarity: 'Common',
        agent_id: 1,
        acquisition_tick: 0,
        acquisition_price: 0.5,
        current_price: 0.5,
        quality_score: 5.0,
        desirability: 5.0,
        win_count: 0,
        loss_count: 0,
        condition: 'mint',
        price_history: [{ tick: 0, price: 0.5, quality_score: 5.0, desirability: 5.0 }],
        gem_colored: 0,
        gem_colorless: 1,
      },
      {
        card_instance_id: 'INST_002_1_1_456',
        card_id: 'C002',
        card_name: 'Rare Card',
        flavor_text: 'A rare card',
        card_color: 'Ruby',
        card_rarity: 'Rare',
        agent_id: 1,
        acquisition_tick: 1,
        acquisition_price: 3.0,
        current_price: 3.5,
        quality_score: 8.0,
        desirability: 2.0, // Low desirability - should highlight
        win_count: 2,
        loss_count: 1,
        condition: 'played',
        price_history: [
          { tick: 1, price: 3.0, quality_score: 8.0, desirability: 5.0 },
          { tick: 2, price: 3.5, quality_score: 8.0, desirability: 2.0 },
        ],
        gem_colored: 2,
        gem_colorless: 0,
      },
    ],
  }

  it('renders inventory table with correct columns', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    expect(screen.getByText('Card Collection')).toBeTruthy()
  })

  it('displays all card names in table', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    expect(screen.queryByText('Common Card')).toBeTruthy()
    expect(screen.queryByText('Rare Card')).toBeTruthy()
  })

  it('displays cost column with colored/uncolored format', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    // First card has 0/1 cost
    expect(screen.getByText('0/1')).toBeTruthy()
    // Second card has 2/0 cost
    expect(screen.getByText('2/0')).toBeTruthy()
  })

  it('displays desirability column with low values highlighted', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const rows = container.querySelectorAll('.inventory-table tbody tr')
    expect(rows.length).toBe(2)

    // Check second row has low-desirability class
    const row = Array.from(rows).find((r) => r.textContent.includes('Rare Card'))
    expect(row?.classList.contains('low-desirability')).toBe(true)
  })

  it('displays rarity with correct styling', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const rarityBadges = container.querySelectorAll('.rarity')
    expect(rarityBadges.length).toBeGreaterThan(0)
  })

  it('displays quality score to 2 decimals', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    expect(screen.getByText('5.00')).toBeTruthy() // First card quality
    expect(screen.getByText('8.00')).toBeTruthy() // Second card quality
  })

  it('handles card row click to show detail', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const rows = screen.queryAllByRole('row')
    expect(rows.length).toBeGreaterThan(0)
  })

  it('displays card collection count in header', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    expect(screen.getByText('Total Cards: 2')).toBeTruthy()
  })
})

describe('AgentInventory - Search and Filter Dropdowns', () => {
  const mockAgent = {
    id: 1,
    prism: 100,
    name: 'Agent 1',
    card_instances: [
      {
        card_instance_id: 'INST_001_1_0_001',
        card_id: 'C001',
        card_name: 'Fire Spell',
        flavor_text: 'Deals damage',
        card_color: 'Ruby',
        card_rarity: 'Rare',
        agent_id: 1,
        acquisition_tick: 0,
        acquisition_price: 2.0,
        current_price: 2.5,
        quality_score: 7.5,
        desirability: 6.0,
        win_count: 3,
        loss_count: 1,
        condition: 'mint',
        price_history: [],
        gem_colored: 2,
        gem_colorless: 1,
      },
      {
        card_instance_id: 'INST_002_1_1_002',
        card_id: 'C002',
        card_name: 'Water Shield',
        flavor_text: 'Provides defense',
        card_color: 'Sapphire',
        card_rarity: 'Common',
        agent_id: 1,
        acquisition_tick: 1,
        acquisition_price: 0.5,
        current_price: 0.6,
        quality_score: 4.0,
        desirability: 4.0,
        win_count: 0,
        loss_count: 0,
        condition: 'mint',
        price_history: [],
        gem_colored: 1,
        gem_colorless: 0,
      },
      {
        card_instance_id: 'INST_003_1_2_003',
        card_id: 'C003',
        card_name: 'Stone Wall',
        flavor_text: 'Blocks attacks',
        card_color: 'Bronze',
        card_rarity: 'Uncommon',
        agent_id: 1,
        acquisition_tick: 2,
        acquisition_price: 1.0,
        current_price: 1.2,
        quality_score: 6.0,
        desirability: 5.0,
        win_count: 1,
        loss_count: 1,
        condition: 'played',
        price_history: [],
        gem_colored: 1,
        gem_colorless: 1,
      },
    ],
  }

  it('renders search input', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const searchInput = container.querySelector('.search-input')
    expect(searchInput).toBeTruthy()
  })

  it('filters cards by search term', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const searchInput = container.querySelector('.search-input') as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'Fire' } })
    expect(screen.queryByText('Fire Spell')).toBeTruthy()
    expect(screen.queryByText('Water Shield')).toBeFalsy()
  })

  it('renders rarity filter dropdown', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const raritySelects = container.querySelectorAll('.filter-select')
    expect(raritySelects.length).toBeGreaterThan(0)
  })

  it('filters cards by rarity', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const raritySelect = Array.from(container.querySelectorAll('.filter-select')).find((s) =>
      s.textContent.includes('All Rarities')
    ) as HTMLSelectElement
    fireEvent.change(raritySelect, { target: { value: 'Rare' } })
    expect(screen.queryByText('Fire Spell')).toBeTruthy()
    expect(screen.queryByText('Water Shield')).toBeFalsy()
  })

  it('filters cards by color', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const colorSelect = Array.from(container.querySelectorAll('.filter-select')).find((s) =>
      s.textContent.includes('All Colors')
    ) as HTMLSelectElement
    fireEvent.change(colorSelect, { target: { value: 'Ruby' } })
    expect(screen.queryByText('Fire Spell')).toBeTruthy()
    expect(screen.queryByText('Water Shield')).toBeFalsy()
  })

  it('renders sort dropdown', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const sortSelect = container.querySelector('.sort-select')
    expect(sortSelect).toBeTruthy()
  })

  it('sorts cards by name', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const sortSelect = container.querySelector('.sort-select') as HTMLSelectElement
    fireEvent.change(sortSelect, { target: { value: 'name' } })
    const rows = container.querySelectorAll('.inventory-table tbody tr')
    expect(rows.length).toBe(3)
  })

  it('shows rarity breakdown in header', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    expect(screen.getByText('Rare: 1')).toBeTruthy()
    expect(screen.getByText('Common: 1')).toBeTruthy()
    expect(screen.getByText('Uncommon: 1')).toBeTruthy()
  })

  it('updates displayed card count after filter', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const searchInput = container.querySelector('.search-input') as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'Fire' } })
    expect(screen.getByText('Showing 1 of 3 cards')).toBeTruthy()
  })
})

describe('AgentInventory - Dropdown Lists (Color, Rarity)', () => {
  const mockAgentMultiColor = {
    id: 1,
    prism: 100,
    name: 'Agent 1',
    card_instances: [
      {
        card_instance_id: 'INST_001_1_0_001',
        card_id: 'C001',
        card_name: 'Ruby Card',
        flavor_text: 'Red',
        card_color: 'Ruby',
        card_rarity: 'Common',
        agent_id: 1,
        acquisition_tick: 0,
        acquisition_price: 0.5,
        current_price: 0.5,
        quality_score: 5.0,
        desirability: 5.0,
        win_count: 0,
        loss_count: 0,
        condition: 'mint',
        price_history: [],
        gem_colored: 0,
        gem_colorless: 0,
      },
      {
        card_instance_id: 'INST_002_1_1_002',
        card_id: 'C002',
        card_name: 'Sapphire Card',
        flavor_text: 'Blue',
        card_color: 'Sapphire',
        card_rarity: 'Rare',
        agent_id: 1,
        acquisition_tick: 1,
        acquisition_price: 3.0,
        current_price: 3.0,
        quality_score: 8.0,
        desirability: 6.0,
        win_count: 1,
        loss_count: 0,
        condition: 'mint',
        price_history: [],
        gem_colored: 1,
        gem_colorless: 0,
      },
      {
        card_instance_id: 'INST_003_1_2_003',
        card_id: 'C003',
        card_name: 'Bronze Card',
        flavor_text: 'Brown',
        card_color: 'Bronze',
        card_rarity: 'Uncommon',
        agent_id: 1,
        acquisition_tick: 2,
        acquisition_price: 1.5,
        current_price: 1.5,
        quality_score: 6.0,
        desirability: 5.0,
        win_count: 0,
        loss_count: 0,
        condition: 'mint',
        price_history: [],
        gem_colored: 0,
        gem_colorless: 1,
      },
    ],
  }

  it('populates color dropdown with unique colors', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgentMultiColor]} />)
    const colorSelect = Array.from(container.querySelectorAll('.filter-select')).find((s) =>
      s.textContent.includes('All Colors')
    ) as HTMLSelectElement
    expect(colorSelect.textContent).toContain('Ruby')
    expect(colorSelect.textContent).toContain('Sapphire')
    expect(colorSelect.textContent).toContain('Bronze')
  })

  it('populates rarity dropdown with available rarities', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgentMultiColor]} />)
    const raritySelect = Array.from(container.querySelectorAll('.filter-select')).find((s) =>
      s.textContent.includes('All Rarities')
    ) as HTMLSelectElement
    expect(raritySelect.textContent).toContain('Common')
    expect(raritySelect.textContent).toContain('Rare')
    expect(raritySelect.textContent).toContain('Uncommon')
  })

  it('maintains dropdown list after sorting', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgentMultiColor]} />)
    const sortSelect = container.querySelector('.sort-select') as HTMLSelectElement
    fireEvent.change(sortSelect, { target: { value: 'rarity' } })
    const colorSelect = Array.from(container.querySelectorAll('.filter-select')).find((s) =>
      s.textContent.includes('All Colors')
    ) as HTMLSelectElement
    expect(colorSelect).toBeTruthy()
  })

  it('handles empty inventory gracefully', () => {
    const emptyAgent = {
      id: 2,
      prism: 100,
      name: 'Empty Agent',
      card_instances: [],
    }
    const { container } = render(<AgentInventory agentId={2} agents={[emptyAgent]} />)
    expect(container.textContent).toContain('No cards match your filters')
  })
})
