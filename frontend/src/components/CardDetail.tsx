import React, { useEffect, useState } from 'react'
import { formatPrice, formatPriceWithCap } from '../utils/priceFormatter'

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

          {/* Price History Graph Placeholder */}
          <div className="card-price-graph-section">
            <h4>Price History</h4>
            <div className="price-graph-placeholder">
              <svg viewBox="0 0 300 150" className="price-graph">
                {/* Grid */}
                {[0, 30, 60, 90, 120, 150].map((y) => (
                  <line key={`h-${y}`} x1="0" y1={y} x2="300" y2={y} stroke="#ddd" strokeWidth="0.5" />
                ))}
                {[0, 60, 120, 180, 240, 300].map((x) => (
                  <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="150" stroke="#ddd" strokeWidth="0.5" />
                ))}

                {/* Sample price curve */}
                <polyline
                  points="0,100 30,95 60,90 90,85 120,80 150,75 180,70 210,72 240,75 300,80"
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth="2"
                />

                {/* Current price dot */}
                <circle cx="300" cy="80" r="3" fill="#FF6B6B" />

                {/* Axis labels */}
                <text x="150" y="145" textAnchor="middle" fontSize="12" fill="#666">
                  Ticks
                </text>
                <text x="10" y="15" fontSize="12" fill="#666">
                  Price
                </text>
              </svg>
              <div className="graph-legend">
                <span className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#4CAF50' }}></span>
                  Price trend (placeholder)
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#FF6B6B' }}></span>
                  Current price
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

}
