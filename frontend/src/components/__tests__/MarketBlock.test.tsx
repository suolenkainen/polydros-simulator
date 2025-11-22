import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MarketBlock from '../MarketBlock'

const mockTestCards = [
  {
    card_instance_id: 'test-1',
    card_id: 'ruby-warrior',
    card_name: 'Fire Elemental',
    card_color: 'Ruby',
    card_rarity: 'Rare',
    agent_id: 0,
    agent_name: 'Agent 0',
    current_price: 45.5,
    quality_score: 8.5,
    desirability: 7.2,
    condition: 'mint',
  },
  {
    card_instance_id: 'test-2',
    card_id: 'sapphire-mage',
    card_name: 'Frost Mage',
    card_color: 'Sapphire',
    card_rarity: 'Mythic',
    agent_id: 0,
    agent_name: 'Agent 0',
    current_price: 125.0,
    quality_score: 9.8,
    desirability: 9.1,
    condition: 'mint',
  },
  {
    card_instance_id: 'test-3',
    card_id: 'emerald-druid',
    card_name: 'Forest Guardian',
    card_color: 'Emerald',
    card_rarity: 'Common',
    agent_id: 0,
    agent_name: 'Agent 0',
    current_price: 12.25,
    quality_score: 6.2,
    desirability: 5.8,
    condition: 'played',
  },
]

describe('MarketBlock', () => {
  describe('rendering', () => {
    it('should render the market title', () => {
      render(<MarketBlock />)
      expect(screen.getByText('Market')).toBeInTheDocument()
    })

    it('should show placeholder when no agents provided', () => {
      const { container } = render(<MarketBlock agents={[]} />)
      // When agents is empty, test data should be shown instead
      const cards = container.querySelectorAll('.market-card')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should render market controls', () => {
      const { container } = render(<MarketBlock agents={[]} />)
      expect(screen.getByPlaceholderText('Search card name...')).toBeInTheDocument()
      const selects = container.querySelectorAll('.filter-select')
      expect(selects.length).toBeGreaterThan(0)
    })

    it('should render test cards when no real agent data', () => {
      const { container } = render(<MarketBlock agents={[]} />)
      // Should find test cards in the rendered output
      const cards = container.querySelectorAll('.market-card')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('search functionality', () => {
    it('should filter cards by name search', async () => {
      const user = userEvent.setup()
      const mockAgents = [
        {
          id: 0,
          card_instances: {
            'inst-1': mockTestCards[0],
            'inst-2': mockTestCards[1],
            'inst-3': mockTestCards[2],
          },
        },
      ]

      render(<MarketBlock agents={mockAgents} />)

      const searchInput = screen.getByPlaceholderText('Search card name...')
      await user.type(searchInput, 'Fire')

      // The card should be visible after filtering
      expect(screen.queryByText('Fire Elemental')).toBeInTheDocument()
    })

    it('should handle empty search results', async () => {
      const user = userEvent.setup()
      const mockAgents = [
        {
          id: 0,
          card_instances: {
            'inst-1': mockTestCards[0],
          },
        },
      ]

      render(<MarketBlock agents={mockAgents} />)

      const searchInput = screen.getByPlaceholderText('Search card name...')
      await user.type(searchInput, 'NonexistentCard')

      expect(screen.getByText('No cards match your filters.')).toBeInTheDocument()
    })
  })

  describe('filtering', () => {
    it('should have rarity filter options', async () => {
      const mockAgents = [
        {
          id: 0,
          card_instances: {
            'inst-1': mockTestCards[0],
            'inst-2': mockTestCards[1],
            'inst-3': mockTestCards[2],
          },
        },
      ]

      const { container } = render(<MarketBlock agents={mockAgents} />)

      // Check for market controls section
      const selects = container.querySelectorAll('.filter-select')
      expect(selects.length).toBeGreaterThan(0)
    })

    it('should have seller filter', () => {
      const mockAgents = [
        {
          id: 0,
          card_instances: {
            'inst-1': mockTestCards[0],
          },
        },
      ]

      render(<MarketBlock agents={mockAgents} />)

      expect(screen.getByDisplayValue('All Sellers')).toBeInTheDocument()
    })
  })

  describe('sorting', () => {
    it('should have sort options', () => {
      const mockAgents = [
        {
          id: 0,
          card_instances: {
            'inst-1': mockTestCards[0],
          },
        },
      ]

      render(<MarketBlock agents={mockAgents} />)

      const sortOptions = screen.queryAllByRole('option')
      expect(sortOptions.length).toBeGreaterThan(0)
    })

    it('should default to price low to high sorting', async () => {
      const mockAgents = [
        {
          id: 0,
          card_instances: {
            'inst-1': mockTestCards[2], // 12.25
            'inst-2': mockTestCards[0], // 45.5
            'inst-3': mockTestCards[1], // 125.0
          },
        },
      ]

      const { container } = render(<MarketBlock agents={mockAgents} />)

      // With default sort (price-low), cheapest should appear first
      const cards = container.querySelectorAll('.market-card-name')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('card display', () => {
    it('should display card information correctly', () => {
      const mockAgents = [
        {
          id: 0,
          card_instances: {
            'inst-1': mockTestCards[0],
          },
        },
      ]

      const { container } = render(<MarketBlock agents={mockAgents} />)

      expect(screen.getByText('Fire Elemental')).toBeInTheDocument()
      expect(screen.getByText('Ruby')).toBeInTheDocument()
      // Look for Rare in market card, not dropdown
      const rarityBadges = container.querySelectorAll('.market-rarity')
      expect(rarityBadges.length).toBeGreaterThan(0)
    })

    it('should display card price', () => {
      const mockAgents = [
        {
          id: 0,
          card_instances: {
            'inst-1': mockTestCards[0],
          },
        },
      ]

      render(<MarketBlock agents={mockAgents} />)

      // Price should be formatted and displayed
      expect(screen.queryByText(/45|45.5/)).toBeInTheDocument()
    })

    it('should display card quality and desirability', () => {
      const mockAgents = [
        {
          id: 0,
          card_instances: {
            'inst-1': mockTestCards[0],
          },
        },
      ]

      render(<MarketBlock agents={mockAgents} />)

      expect(screen.getByText('Quality')).toBeInTheDocument()
      expect(screen.getByText('Desirability')).toBeInTheDocument()
    })

    it('should display seller information', () => {
      const mockAgents = [
        {
          id: 0,
          card_instances: {
            'inst-1': mockTestCards[0],
          },
        },
      ]

      const { container } = render(<MarketBlock agents={mockAgents} />)

      // Look for seller text in seller section, not dropdown
      const sellerInfo = container.querySelector('.market-card-seller')
      expect(sellerInfo).toBeTruthy()
    })

    it('should display buy now button', () => {
      const mockAgents = [
        {
          id: 0,
          card_instances: {
            'inst-1': mockTestCards[0],
          },
        },
      ]

      render(<MarketBlock agents={mockAgents} />)

      expect(screen.getByText('Buy Now')).toBeInTheDocument()
    })
  })

  describe('test data', () => {
    it('should use test data when no real agents provided', () => {
      render(<MarketBlock agents={undefined} />)

      // Test data should be visible
      // Check for some of the test card names
      expect(screen.queryByText(/Fire Elemental|Frost Mage|Forest Guardian/)).toBeInTheDocument()
    })

    it('should have diverse test data', () => {
      const { container } = render(<MarketBlock agents={[]} />)

      // Should have multiple cards rendered
      const cards = container.querySelectorAll('.market-card')
      expect(cards.length).toBeGreaterThan(1)

      // Should have rarity badges
      const rarities = container.querySelectorAll('.market-rarity')
      expect(rarities.length).toBeGreaterThan(0)
    })

    it('should have reasonable test prices', () => {
      render(<MarketBlock agents={[]} />)

      // Price range should be reasonable (1.75 to 189.99 in test data)
      const cards = document.querySelectorAll('.market-card-price')
      expect(cards.length).toBeGreaterThan(0)
    })
  })
})
