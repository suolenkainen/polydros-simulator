import React from 'react'
import { type Card, RARITY_ORDER, cardThumbUrl, fetchCards, rarityName } from './cardApi'
import { type CardFilters, NO_FILTERS, distinct, filterCards } from './filterCards'
import CardView from './CardView'
import './cards.css'

// The card set: every card as a thumbnail, with filters, and a full view of
// one card on click. Everything comes from GET /cards; nothing here depends
// on a simulation run.
export default function CardBrowser() {
  const [cards, setCards] = React.useState<Card[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [filters, setFilters] = React.useState<CardFilters>(NO_FILTERS)
  const [selected, setSelected] = React.useState<Card | null>(null)

  React.useEffect(() => {
    fetchCards()
      .then(setCards)
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) {
    return (
      <p className="card-browser-message">
        Couldn't load the cards: {error}. Is the backend running at port 8000?
      </p>
    )
  }
  if (!cards) return <p className="card-browser-message">Loading cards…</p>

  const shown = filterCards(cards, filters)
  const setFilter = (field: keyof CardFilters) => (e: { target: { value: string } }) =>
    setFilters({ ...filters, [field]: e.target.value })

  return (
    <div className="card-browser">
      <div className="card-browser-filters">
        <input
          type="search"
          placeholder="Search by name"
          aria-label="Search by name"
          value={filters.search}
          onChange={setFilter('search')}
        />
        <select aria-label="Colour" value={filters.color} onChange={setFilter('color')}>
          <option value="">Any colour</option>
          {distinct(cards, 'color').map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select aria-label="Type" value={filters.type} onChange={setFilter('type')}>
          <option value="">Any type</option>
          {distinct(cards, 'type').map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select aria-label="Rarity" value={filters.rarity} onChange={setFilter('rarity')}>
          <option value="">Any rarity</option>
          {RARITY_ORDER.map((r) => (
            <option key={r} value={r}>
              {rarityName(r)}
            </option>
          ))}
        </select>
        <span className="card-browser-count">
          {shown.length} of {cards.length} cards
        </span>
      </div>

      <ul className="card-grid">
        {shown.map((card) => (
          <li key={card.id}>
            <button className="card-tile" onClick={() => setSelected(card)}>
              <img src={cardThumbUrl(card.id)} alt="" loading="lazy" />
              <span className="card-tile-name">{card.name}</span>
              <span className={`rarity rarity-${card.rarity.toLowerCase()}`}>
                {rarityName(card.rarity)}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {selected && <CardView card={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
