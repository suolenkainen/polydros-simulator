import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AgentInventory from '../AgentInventory'

describe('AgentInventory', () => {
  const mockAgent = {
    id: 1,
    prism: 100,
    name: 'Agent 1',
    card_instances: {
      'INST_001': {
        card_instance_id: 'INST_001',
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
        price_history: [
          { tick: 0, price: 0.5, quality_score: 5.0, desirability: 5.0 },
        ],
        gem_colored: 0,
        gem_colorless: 1,
      },
      'INST_002': {
        card_instance_id: 'INST_002',
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
        desirability: 2.0,
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
    },
  }

  it('renders collection title', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    expect(screen.getByText(/Card Collection/)).toBeTruthy()
  })

  it('displays total card count', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    expect(screen.getByText(/Total Cards: 2/)).toBeTruthy()
  })

  it('displays card names', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    expect(screen.getByText('Common Card')).toBeTruthy()
    expect(screen.getByText('Rare Card')).toBeTruthy()
  })

  it('displays card rarities', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const rarityBadges = container.querySelectorAll('.rarity')
    expect(rarityBadges.length).toBeGreaterThanOrEqual(2)
  })

  it('displays quality scores', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    expect(screen.getByText(/Q: 5\.00/)).toBeTruthy()
    expect(screen.getByText(/Q: 8\.00/)).toBeTruthy()
  })

  it('displays desirability scores', () => {
    render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    expect(screen.getByText(/D: 5\.0/)).toBeTruthy()
    expect(screen.getByText(/D: 2\.0/)).toBeTruthy()
  })

  it('has expand icons', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const expandIcons = container.querySelectorAll('.expand-icon')
    expect(expandIcons.length).toBeGreaterThanOrEqual(2)
  })

  it('displays mini graphs', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const miniGraphs = container.querySelectorAll('.mini-graph')
    expect(miniGraphs.length).toBeGreaterThan(0)
  })

  it('shows placeholder when no agent selected', () => {
    render(<AgentInventory agentId={null} agents={[]} />)
    expect(screen.getByText(/Select an agent/)).toBeTruthy()
  })

  it('has search and filter controls', () => {
    const { container } = render(<AgentInventory agentId={1} agents={[mockAgent]} />)
    const searchInput = container.querySelector('input[placeholder="Search card name..."]')
    expect(searchInput).toBeTruthy()
  })
})
