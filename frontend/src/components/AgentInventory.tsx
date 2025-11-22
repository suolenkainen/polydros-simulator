import React, { useEffect, useState } from 'react'
import { formatPrice, formatPriceWithCap } from '../utils/priceFormatter'
import CardDetail from './CardDetail'

type PricePoint = {
  tick: number
  price: number
  quality_score: number
  desirability: number
}

type Card = {
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
  cost?: number
  gem_colored?: number
  gem_colorless?: number
  type?: string
  condition?: string
  desirability?: number
  win_count?: number
  loss_count?: number
  flavor_text?: string
  priceHistory?: PricePoint[]
}

type InventoryData = {
  id: number
  name: string
  collection_count: number
  cards: Card[]
}

type AgentInventoryProps = {
  agentId: number | null
  agents?: any[]
}

export default function AgentInventory({ agentId, agents }: AgentInventoryProps) {
  const [inventory, setInventory] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRarity, setFilterRarity] = useState<string>('all')
  const [filterColor, setFilterColor] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'rarity' | 'quality' | 'price'>('name')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!agentId) {
      setInventory(null)
      return
    }

    // If agents data is provided, use card_instances from it
    if (agents && agents.length > 0) {
      console.log('[AgentInventory] Using agents prop:', agents.length, 'agents available')
      const agent = agents.find((a) => a.id === agentId)
      console.log('[AgentInventory] Found agent:', agent?.id, 'with', agent?.card_instances, 'card instances')
      if (agent && agent.card_instances) {
        // Convert card_instances to inventory format
        // Handle both array and object (dictionary) formats
        const instancesArray = Array.isArray(agent.card_instances)
          ? agent.card_instances
          : Object.values(agent.card_instances)
        
        const cards = instancesArray.map((instance: any) => ({
          card_id: instance.card_id,
          name: instance.card_name || instance.name || 'Unknown Card',
          color: instance.card_color || '',
          rarity: instance.card_rarity || '',
          is_hologram: instance.is_hologram || false,
          quality_score: instance.quality_score || 0,
          price: instance.current_price || 0,
          attractiveness: instance.desirability || 0,
          priceHistory: instance.price_history || [],
          power: instance.power,
          health: instance.health,
          cost: instance.cost,
          gem_colored: instance.gem_colored || 0,
          gem_colorless: instance.gem_colorless || 0,
          type: instance.type,
          flavor_text: instance.flavor_text || '',
          condition: instance.condition,
          desirability: instance.desirability,
          win_count: instance.win_count,
          loss_count: instance.loss_count,
        }))
        console.log('[AgentInventory] Converted cards:', cards.length > 0 ? cards[0] : 'no cards')
        setInventory({
          id: agent.id,
          name: `Agent ${agent.id}`,
          collection_count: cards.length,
          cards,
        })
        setLoading(false)
        return
      }
    }

    // Otherwise, fetch from API
    const fetchInventory = async () => {
      setLoading(true)
      setError(null)
      console.log('[AgentInventory] No agents prop or agent not found, falling back to API')
      try {
        const response = await fetch(`http://127.0.0.1:8000/agents/${agentId}/cards`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json()
        if (data.error) {
          setError(data.error)
          setInventory(null)
        } else {
          // Convert card_instances from API to Card format
          const cards = (data.cards || []).map((instance: any) => ({
            card_id: instance.card_id,
            name: instance.card_name || instance.name || 'Unknown Card',
            color: instance.card_color || '',
            rarity: instance.card_rarity || '',
            is_hologram: instance.is_hologram || false,
            quality_score: instance.quality_score || 0,
            price: instance.current_price || 0,
            attractiveness: instance.desirability || 0,
            priceHistory: instance.price_history || [],
            power: instance.power,
            health: instance.health,
            cost: instance.cost,
            gem_colored: instance.gem_colored || 0,
            gem_colorless: instance.gem_colorless || 0,
            type: instance.type,
            flavor_text: instance.flavor_text || '',
            condition: instance.condition,
            desirability: instance.desirability,
            win_count: instance.win_count,
            loss_count: instance.loss_count,
          }))
          console.log('[AgentInventory] API returned', cards.length, 'cards')
          setInventory({
            id: data.id,
            name: data.name,
            collection_count: data.collection_count,
            cards,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch inventory')
        setInventory(null)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [agentId, agents])

  if (!agentId) {
    return (
      <div className="agent-inventory">
        <div className="inventory-placeholder">Select an agent to view their card collection.</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="agent-inventory">
        <div className="inventory-placeholder">Loading inventory...</div>
      </div>
    )
  }

  if (error || !inventory) {
    return (
      <div className="agent-inventory">
        <div className="inventory-placeholder">Error: {error || 'No data'}</div>
      </div>
    )
  }

  // Filter and sort cards
  let displayCards = inventory.cards
  if (filterRarity !== 'all') {
    displayCards = displayCards.filter((c) => c.rarity === filterRarity)
  }
  if (filterColor !== 'all') {
    displayCards = displayCards.filter((c) => c.color === filterColor)
  }
  if (searchTerm) {
    displayCards = displayCards.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  if (sortBy === 'name') {
    displayCards = [...displayCards].sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy === 'rarity') {
    const rarityOrder: Record<string, number> = {
      Mythic: 0,
      Rare: 1,
      Uncommon: 2,
      Common: 3,
      Player: 4,
    }
    displayCards = [...displayCards].sort((a, b) => (rarityOrder[a.rarity] ?? 5) - (rarityOrder[b.rarity] ?? 5))
  } else if (sortBy === 'quality') {
    displayCards = [...displayCards].sort((a, b) => b.quality_score - a.quality_score)
  } else if (sortBy === 'price') {
    displayCards = [...displayCards].sort((a, b) => b.price - a.price)
  }

  // Count cards by rarity
  const rarityCount: Record<string, number> = {}
  inventory.cards.forEach((c) => {
    rarityCount[c.rarity] = (rarityCount[c.rarity] || 0) + 1
  })

  const toggleExpanded = (cardId: string) => {
    const newExpanded = new Set(expandedCardIds)
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId)
    } else {
      newExpanded.add(cardId)
    }
    setExpandedCardIds(newExpanded)
  }

  const getLastTenTicks = (priceHistory: PricePoint[] | undefined): PricePoint[] => {
    if (!priceHistory || priceHistory.length === 0) return []
    return priceHistory.slice(-10)
  }

  const renderMiniGraph = (priceHistory: PricePoint[] | undefined) => {
    const lastTen = getLastTenTicks(priceHistory)
    if (lastTen.length === 0) return null

    const prices = lastTen.map((p) => p.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    // Generate SVG path for line chart
    const width = 200
    const height = 40
    const padding = 4

    const points = lastTen.map((point, idx) => {
      const x = padding + (idx / (lastTen.length - 1 || 1)) * (width - 2 * padding)
      const y = height - padding - ((point.price - minPrice) / priceRange) * (height - 2 * padding)
      return `${x},${y}`
    })

    const pathData = `M ${points.join(' L ')}`

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mini-graph">
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="#4CAF50"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={points[points.length - 1]?.split(',')[0]} cy={points[points.length - 1]?.split(',')[1]} r="2" fill="#FF6B6B" />
      </svg>
    )
  }

  return (
    <div className="agent-inventory">
      <h2>{inventory.name}'s Card Collection</h2>
      <div className="inventory-stats">
        <span className="stat-item">Total Cards: {inventory.collection_count}</span>
        {Object.entries(rarityCount).map(([rarity, count]) => (
          <span key={rarity} className={`stat-item rarity-${rarity.toLowerCase()}`}>
            {rarity}: {count}
          </span>
        ))}
      </div>

      <div className="inventory-controls">
        <input
          type="text"
          placeholder="Search card name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} className="filter-select">
          <option value="all">All Rarities</option>
          <option value="Mythic">Mythic</option>
          <option value="Rare">Rare</option>
          <option value="Uncommon">Uncommon</option>
          <option value="Common">Common</option>
          <option value="Player">Player</option>
          <option value="Alternate Art">Alternate Art</option>
        </select>

        <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)} className="filter-select">
          <option value="all">All Colors</option>
          {Array.from(new Set(inventory.cards.map((c) => c.color)))
            .sort()
            .map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'rarity' | 'quality' | 'price')} className="sort-select">
          <option value="name">Sort by Name</option>
          <option value="rarity">Sort by Rarity</option>
          <option value="quality">Sort by Quality</option>
          <option value="price">Sort by Price</option>
        </select>
      </div>

      <div className="inventory-table-container">
        {displayCards.length === 0 ? (
          <div className="inventory-placeholder">No cards match your filters.</div>
        ) : (
          <div className="inventory-list">
            {displayCards.map((card, idx) => {
              const isLowDesirability = card.desirability !== undefined && card.desirability < 3.0
              const cardKey = `${card.card_id}-${idx}`
              const isExpanded = expandedCardIds.has(cardKey)
              const lastTen = getLastTenTicks(card.priceHistory)

              return (
                <div key={idx} className={`inventory-card-row rarity-${card.rarity.toLowerCase()}`}>
                  <div
                    className={`inventory-card-header ${isLowDesirability ? 'low-desirability' : ''}`}
                    onClick={() => toggleExpanded(cardKey)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-header-left">
                      <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                      <span 
                        className="card-name" 
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCard(card)
                        }}
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        {card.name}
                      </span>
                      <span className={`rarity rarity-${card.rarity.toLowerCase()}`}>{card.rarity}</span>
                      <span className="card-color">{card.color}</span>
                    </div>

                    <div className="card-header-right">
                      <span className="quality">Q: {card.quality_score.toFixed(2)}</span>
                      <span className={`desirability ${isLowDesirability ? 'critical' : ''}`}>
                        D: {card.desirability?.toFixed(1) || '—'}
                      </span>
                      <span className="card-price">{formatPrice(card.price)}</span>
                      {lastTen.length > 0 && renderMiniGraph(card.priceHistory)}
                    </div>
                  </div>

                  {isExpanded && lastTen.length > 0 && (
                    <div className="inventory-card-details">
                      <div className="price-history-list">
                        <h4>Last 10 Ticks</h4>
                        <div className="tick-list">
                          {lastTen.map((point, i) => (
                            <div key={i} className="tick-entry">
                              <span className="tick-number">Tick {point.tick}:</span>
                              <span className="tick-price">{formatPrice(point.price)} prisms</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {isExpanded && lastTen.length === 0 && (
                    <div className="inventory-card-details">
                      <div className="price-history-list">
                        <p style={{ color: '#999', margin: '10px 0' }}>No price history available</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="inventory-footer">Showing {displayCards.length} of {inventory.collection_count} cards</div>

      {selectedCard && <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />}

      <style>{`
        .inventory-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: #0d0d0d;
          border-radius: 4px;
          overflow: hidden;
        }

        .inventory-card-row {
          border: 1px solid #333;
          border-radius: 4px;
          overflow: hidden;
          background: #1a1a2e;
        }

        .inventory-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #16213e;
          border-bottom: 1px solid transparent;
          transition: background 0.2s;
        }

        .inventory-card-row:hover .inventory-card-header {
          background: #1f2947;
        }

        .inventory-card-header.low-desirability {
          background: rgba(255, 107, 107, 0.15);
        }

        .card-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .expand-icon {
          display: inline-flex;
          width: 20px;
          font-size: 12px;
          color: #aaa;
        }

        .card-name {
          font-weight: 500;
          color: #fff;
          min-width: 200px;
        }

        .rarity {
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rarity-mythic {
          background: #9c3c0f;
          color: white;
        }

        .rarity-rare {
          background: #3c6382;
          color: white;
        }

        .rarity-uncommon {
          background: #2d5016;
          color: white;
        }

        .rarity-common {
          background: #f0f0f0;
          color: #333333;
        }

        .rarity-player {
          background: #6b3b8a;
          color: white;
        }

        .rarity-alternate-art {
          background: #c2a000;
          color: white;
        }

        .card-color {
          color: #aaa;
          font-size: 12px;
        }

        .card-header-right {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-left: 20px;
        }

        .quality {
          color: #aaa;
          font-size: 13px;
          min-width: 70px;
        }

        .desirability {
          color: #aaa;
          font-size: 13px;
          min-width: 70px;
        }

        .desirability.critical {
          color: #FF6B6B;
          font-weight: 600;
        }

        .card-price {
          color: #4CAF50;
          font-weight: 600;
          min-width: 70px;
        }

        .mini-graph {
          width: 200px;
          height: 40px;
          margin-left: 20px;
        }

        .inventory-card-details {
          padding: 16px;
          background: #0d0d0d;
          border-top: 1px solid #222;
        }

        .price-history-list {
          background: #16213e;
          border-radius: 4px;
          padding: 12px;
        }

        .price-history-list h4 {
          margin: 0 0 10px 0;
          color: #aaa;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tick-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .tick-entry {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: #1a1a2e;
          border-radius: 3px;
          border-left: 3px solid #4CAF50;
        }

        .tick-number {
          color: #aaa;
          font-size: 12px;
          font-weight: 500;
        }

        .tick-price {
          color: #4CAF50;
          font-weight: 600;
          font-size: 13px;
        }

        .rarity-row-mythic .inventory-card-header {
          border-left: 4px solid #9c3c0f;
        }

        .rarity-row-rare .inventory-card-header {
          border-left: 4px solid #3c6382;
        }

        .rarity-row-uncommon .inventory-card-header {
          border-left: 4px solid #2d5016;
        }

        .rarity-row-common .inventory-card-header {
          border-left: 4px solid #555;
        }
      `}</style>
    </div>
  )
}
