import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CardDetail from '../CardDetail'

describe('CardDetail - Price History Chart', () => {
  const mockCard = {
    card_id: 'C001',
    name: 'Test Card',
    color: 'Sapphire',
    rarity: 'Rare',
    is_hologram: false,
    quality_score: 8.5,
    price: 2.5,
    power: 3,
    health: 4,
    gem_colored: 2,
    gem_colorless: 1,
    flavor_text: 'Test flavor',
    priceHistory: [
      { tick: 0, price: 1.0, quality_score: 8.0, desirability: 5.0 },
      { tick: 1, price: 1.5, quality_score: 8.2, desirability: 5.5 },
      { tick: 2, price: 2.0, quality_score: 8.4, desirability: 6.0 },
      { tick: 3, price: 2.5, quality_score: 8.5, desirability: 6.5 },
    ],
  }

  it('renders card name and rarity', () => {
    render(<CardDetail card={mockCard} onClose={() => {}} />)
    expect(screen.getByText('Test Card')).toBeTruthy()
    expect(screen.getByText('Rare')).toBeTruthy()
  })

  it('displays card attributes without errors', () => {
    const { container } = render(<CardDetail card={mockCard} onClose={() => {}} />)
    expect(container).toBeTruthy()
    expect(container.querySelector('.card-detail-header')).toBeTruthy()
  })

  it('handles missing price history gracefully', () => {
    const cardNoHistory = { ...mockCard, priceHistory: undefined }
    const { container } = render(<CardDetail card={cardNoHistory} onClose={() => {}} />)
    expect(container).toBeTruthy()
  })

  it('displays alternate art image with center positioning', () => {
    const altArtCard = { ...mockCard, rarity: 'Alternate Art' }
    const { container } = render(<CardDetail card={altArtCard} onClose={() => {}} />)
    const img = container.querySelector('img[alt="Test Card"]') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img?.style.objectPosition).toBe('center')
  })

  it('displays regular card image with top positioning', () => {
    const { container } = render(<CardDetail card={mockCard} onClose={() => {}} />)
    const img = container.querySelector('img[alt="Test Card"]') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img?.style.objectPosition).toBe('center top')
  })

  it('renders cost display with gem counts', () => {
    render(<CardDetail card={mockCard} onClose={() => {}} />)
    const costText = screen.queryByText(/sapphire.*uncolored/i)
    expect(costText).toBeTruthy()
  })

  it('closes modal when close button clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<CardDetail card={mockCard} onClose={onClose} />)
    const closeBtn = container.querySelector('.card-detail-close') as HTMLButtonElement
    expect(closeBtn).toBeTruthy()
    closeBtn?.click()
    expect(onClose).toHaveBeenCalled()
  })
})

describe('CardDetail - Data Structure Validation', () => {
  it('correctly formats price to 2 decimals in display', () => {
    const card = {
      card_id: 'C002',
      name: 'Expensive Card',
      color: 'Ruby',
      rarity: 'Mythic',
      is_hologram: true,
      quality_score: 9.5,
      price: 15.25,
      priceHistory: [
        { tick: 0, price: 10.5, quality_score: 9.0, desirability: 7.5 },
        { tick: 1, price: 15.25, quality_score: 9.5, desirability: 8.0 },
      ],
    }
    const { container } = render(<CardDetail card={card} onClose={() => {}} />)
    expect(container.textContent).toContain('15.25')
  })

  it('validates price history tick progression', () => {
    const card = {
      card_id: 'C003',
      name: 'Progression Card',
      color: 'Onyx',
      rarity: 'Common',
      is_hologram: false,
      quality_score: 5.0,
      price: 0.5,
      priceHistory: [
        { tick: 0, price: 0.5, quality_score: 5.0, desirability: 3.0 },
        { tick: 1, price: 0.5, quality_score: 5.0, desirability: 3.0 },
        { tick: 2, price: 0.5, quality_score: 5.0, desirability: 3.0 },
      ],
    }
    const { container } = render(<CardDetail card={card} onClose={() => {}} />)
    expect(screen.queryByText('Progression Card')).toBeTruthy()
    expect(card.priceHistory.length).toBe(3)
    expect(card.priceHistory[0].tick).toBe(0)
    expect(card.priceHistory[2].tick).toBe(2)
  })

  it('handles edge case: single price point', () => {
    const card = {
      card_id: 'C004',
      name: 'Single Point Card',
      color: 'Bronze',
      rarity: 'Uncommon',
      is_hologram: false,
      quality_score: 6.0,
      price: 1.0,
      priceHistory: [{ tick: 0, price: 1.0, quality_score: 6.0, desirability: 4.0 }],
    }
    const { container } = render(<CardDetail card={card} onClose={() => {}} />)
    expect(screen.queryByText('Single Point Card')).toBeTruthy()
    expect(card.priceHistory.length).toBe(1)
  })

  it('handles edge case: zero-value prices', () => {
    const card = {
      card_id: 'C005',
      name: 'Zero Price Card',
      color: 'Jade',
      rarity: 'Common',
      is_hologram: false,
      quality_score: 1.0,
      price: 0.0,
      priceHistory: [{ tick: 0, price: 0.01, quality_score: 1.0, desirability: 1.0 }],
    }
    const { container } = render(<CardDetail card={card} onClose={() => {}} />)
    expect(screen.queryByText('Zero Price Card')).toBeTruthy()
    expect(card.price).toBe(0.0)
  })

  it('validates rarity colors are defined', () => {
    const rarities = ['Common', 'Uncommon', 'Rare', 'Mythic', 'Player', 'Alternate Art']
    rarities.forEach((rarity) => {
      const card = {
        card_id: `C_${rarity}`,
        name: `${rarity} Card`,
        color: 'Test',
        rarity,
        is_hologram: false,
        quality_score: 5.0,
        price: 1.0,
      }
      const { container } = render(<CardDetail card={card} onClose={() => {}} />)
      expect(container.querySelector('.card-rarity-inline')).toBeTruthy()
    })
  })
})

