import React from 'react'
import { type Card, cardImageUrl, rarityName } from './cardApi'
import { getContrastingTextColor, getGemColorInfo } from '../utils/gemColors'

// One card in full: the picture and everything the card set knows about it.
// Opens over the grid; closes on the button, a click outside, or Escape.
export default function CardView({ card, onClose }: { card: Card; onClose: () => void }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const gem = getGemColorInfo(card.color)

  return (
    <div className="card-view-overlay" onClick={onClose}>
      <div
        className="card-view"
        role="dialog"
        aria-label={card.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="card-view-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <img className="card-view-image" src={cardImageUrl(card.id)} alt={card.name} />
        <div className="card-view-body">
          <h2>{card.name}</h2>
          <div className="card-view-tags">
            <span className={`rarity rarity-${card.rarity.toLowerCase()}`}>
              {rarityName(card.rarity)}
            </span>
            <span
              className="gem"
              style={{ backgroundColor: gem.hexColor, color: getContrastingTextColor(gem.hexColor) }}
            >
              {gem.icon} {card.color}
            </span>
            <span className="card-view-type">{card.type}</span>
          </div>

          <dl className="card-view-stats">
            <dt>Cost</dt>
            <dd>
              {card.gem_colored} {card.color}, {card.gem_colorless} any
            </dd>
            <dt>Power</dt>
            <dd>{card.power}</dd>
            <dt>Health</dt>
            <dd>{card.health}</dd>
            <dt>Labels</dt>
            <dd>{card.labels.join(', ')}</dd>
            <dt>In packs</dt>
            <dd>
              weight {card.pack_weight}, hologram {(card.holo_chance * 100).toFixed(2)}%
            </dd>
          </dl>

          {card.flavor_text && <p className="card-view-flavor">{card.flavor_text}</p>}
          <p className="card-view-id">{card.id}</p>
        </div>
      </div>
    </div>
  )
}
