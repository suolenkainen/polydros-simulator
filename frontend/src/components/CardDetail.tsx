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

          {/* Price History Graph Placeholder */}
          <div className="card-price-graph-section">
            <h4>Price History</h4>
            <div className="price-graph-placeholder">
              {card.priceHistory && card.priceHistory.length > 0 ? (
                <>
                  <svg viewBox="0 0 350 180" className="price-graph">
                    {/* Grid lines */}
                    {[0, 30, 60, 90, 120, 150].map((y) => (
                      <line key={`h-${y}`} x1="40" y1={y} x2="330" y2={y} stroke="#eee" strokeWidth="0.5" />
                    ))}
                    {[0, 58, 116, 174, 232, 290].map((x) => (
                      <line key={`v-${x}`} x1={x + 40} y1="0" x2={x + 40} y2="150" stroke="#eee" strokeWidth="0.5" />
                    ))}

                    {/* Calculate scaling */}
                    {(() => {
                      const prices = card.priceHistory.map(p => p.price)
                      const minPrice = Math.min(...prices)
                      const maxPrice = Math.max(...prices)
                      const priceRange = maxPrice - minPrice || 1
                      const tickRange = card.priceHistory.length - 1 || 1

                      // Generate points for polyline
                      const points = card.priceHistory.map((point, idx) => {
                        const x = 40 + (idx / tickRange) * 290
                        const y = 150 - ((point.price - minPrice) / priceRange) * 150
                        return `${x},${y}`
                      }).join(' ')

                      return (
                        <>
                          {/* Price curve */}
                          <polyline
                            points={points}
                            fill="none"
                            stroke="#4CAF50"
                            strokeWidth="2"
                          />
                          {/* Current price dot */}
                          {(() => {
                            const lastPoint = card.priceHistory[card.priceHistory.length - 1]
                            const x = 40 + 290
                            const y = 150 - ((lastPoint.price - minPrice) / priceRange) * 150
                            return <circle cx={x} cy={y} r="3" fill="#FF6B6B" />
                          })()}
                        </>
                      )
                    })()}

                    {/* Y-axis (Price) */}
                    <line x1="40" y1="0" x2="40" y2="150" stroke="#333" strokeWidth="1" />
                    {/* X-axis (Ticks) */}
                    <line x1="40" y1="150" x2="330" y2="150" stroke="#333" strokeWidth="1" />

                    {/* Y-axis label */}
                    <text x="15" y="75" textAnchor="middle" fontSize="11" fill="#333" transform="rotate(-90 15 75)">
                      Prisms
                    </text>
                    {/* X-axis label */}
                    <text x="185" y="170" textAnchor="middle" fontSize="11" fill="#333">
                      Tick
                    </text>

                    {/* Y-axis tick labels */}
                    {(() => {
                      if (card.priceHistory.length === 0) return null
                      const prices = card.priceHistory.map(p => p.price)
                      const minPrice = Math.min(...prices)
                      const maxPrice = Math.max(...prices)
                      return [0, 50, 100, 150].map((y) => (
                        <text key={`y-${y}`} x="35" y={150 - y} textAnchor="end" fontSize="9" fill="#666">
                          {(minPrice + (maxPrice - minPrice) * (y / 150)).toFixed(0)}
                        </text>
                      ))
                    })()}

                    {/* X-axis tick labels (show first, middle, last tick) */}
                    {(() => {
                      if (card.priceHistory.length === 0) return null
                      const first = card.priceHistory[0].tick
                      const last = card.priceHistory[card.priceHistory.length - 1].tick
                      const mid = Math.floor((first + last) / 2)
                      const ticks = [first, mid, last]
                      const tickRange = last - first || 1
                      return ticks.map((tick) => (
                        <text
                          key={`x-${tick}`}
                          x={40 + ((tick - first) / tickRange) * 290}
                          y="165"
                          textAnchor="middle"
                          fontSize="9"
                          fill="#666"
                        >
                          {tick}
                        </text>
                      ))
                    })()}
                  </svg>
                  <div className="graph-legend">
                    <span className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: '#4CAF50' }}></span>
                      Price trend
                    </span>
                    <span className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: '#FF6B6B' }}></span>
                      Current price
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
                  No price history available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

}
