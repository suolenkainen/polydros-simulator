import React, { useEffect, useState } from 'react'
import { formatPrice, formatPriceWithCap } from '../utils/priceFormatter'

type PriceDataPoint = {
  tick: number
  price: number
  quality_score: number
  desirability: number
}

type CardData = {
  card_id: string
  name: string
  color: string
  rarity: string
  is_hologram: boolean
  quality_score: number
  price: number
  attractiveness?: number
  power?: number
  health?: number
  gem_colored?: number
  gem_colorless?: number
  flavor_text?: string
  priceHistory?: PriceDataPoint[]
}

type CardStats = {
  power?: number
  health?: number
  cost?: number
  type?: string
}

interface CardDetailProps {
  card: CardData & Partial<CardStats>
  onClose: () => void
}

export default function CardDetail({ card, onClose }: CardDetailProps) {
  const { formatted: formattedPrice, isCapped } = formatPriceWithCap(card.price)
  const rarityColors: Record<string, string> = {
    Common: '#888888',
    Uncommon: '#2d5016',
    Rare: '#3c6382',
    Mythic: '#9c3c0f',
    Player: '#6b3b8a',
    'Alternate Art': '#c2a000',
  }

  const rarityColor = rarityColors[card.rarity] || '#888888'
  
  // Alternate Art cards show full image, others align to top
  const isAlternateArt = card.rarity === 'Alternate Art'
  const imageObjectPosition = isAlternateArt ? 'center' : 'center top'

  // Generate gem text from gem_colored and gem_colorless
  const gemTexts: string[] = []
  const gemColorName = card.color.toLowerCase()
  
  if (card.gem_colored !== undefined && card.gem_colored > 0) {
    for (let i = 0; i < card.gem_colored; i++) {
      gemTexts.push(gemColorName)
    }
  }
  if (card.gem_colorless !== undefined && card.gem_colorless > 0) {
    for (let i = 0; i < card.gem_colorless; i++) {
      gemTexts.push('uncolored')
    }
  }
  const costText = gemTexts.length > 0 ? gemTexts.join(', ') : 'no cost'

  return (
    <div className="card-detail-overlay" onClick={onClose}>
      <div className="card-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="card-detail-close" onClick={onClose}>
          ✕
        </button>

        {/* Card Header */}
        <div className="card-detail-header">
          <h2>
            {card.name}{' '}
            <span className="card-rarity-inline" style={{ backgroundColor: rarityColor }}>
              {card.rarity}
            </span>
          </h2>
          <div className="card-detail-meta">
            <span className="card-color">{card.color}</span>
            {card.is_hologram && <span className="card-hologram">✨ Hologram</span>}
          </div>
        </div>

        <div className="card-detail-content">
          {/* Card Image */}
          <div className="card-image-placeholder">
            <img 
              src={`/cards/${card.card_id}.png`}
              alt={card.name}
              style={{ objectPosition: imageObjectPosition }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180"%3E%3Crect fill="%23333" width="320" height="180"/%3E%3Ctext x="50%25" y="50%25" fill="%23999" text-anchor="middle" dy=".3em" font-size="14"%3ECard Image Not Found%3C/text%3E%3C/svg%3E'
              }} 
            />
          </div>

          {/* Card Stats */}
          <div className="card-stats-section">
            <div className="stats-grid">
              <div className="stat-item">
                <label>Cost</label>
                <div className="stat-value">
                  <span title={`${card.gem_colored || 0} ${card.color}, ${card.gem_colorless || 0} uncolored`}>
                    {costText}
                  </span>
                </div>
              </div>

              {card.power !== undefined && (
                <div className="stat-item">
                  <label>Power</label>
                  <div className="stat-value">
                    {card.power > 0 ? <span>⚔ {card.power}</span> : <span>—</span>}
                  </div>
                </div>
              )}

              {card.health !== undefined && (
                <div className="stat-item">
                  <label>Defence</label>
                  <div className="stat-value">
                    {card.health > 0 ? <span>🛡 {card.health}</span> : <span>—</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Features */}
          <div className="card-features-section">
            <h4>Features</h4>
            <div className="card-feature-text">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            </div>
          </div>

          {/* Card Flavor */}
          <div className="card-flavor-section">
            <h4>Flavor</h4>
            <div className="card-flavor-text">
              <p><em>{card.flavor_text || 'No flavor text available.'}</em></p>
            </div>
          </div>

          {/* Economy Data */}
          <div className="card-economy-section">
            <h4>Market Data</h4>
            <div className="economy-grid">
              <div className="economy-item">
                <label>Current Price</label>
                <div className="economy-value">
                  <span className={isCapped ? 'price-capped' : ''}>{formattedPrice} Ⓟ</span>
                  {isCapped && <small className="price-cap-note">(capped at 10000)</small>}
                </div>
              </div>

              <div className="economy-item">
                <label>Quality Score</label>
                <div className="economy-value">{card.quality_score.toFixed(2)}</div>
              </div>

              {card.attractiveness !== undefined && (
                <div className="economy-item">
                  <label>Attractiveness</label>
                  <div className="economy-value">{card.attractiveness.toFixed(4)}</div>
                </div>
              )}
            </div>
          </div>


        </div>
      </div>
    </div>
  )

}
