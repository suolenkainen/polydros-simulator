import React, { useEffect, useState } from 'react'
import { formatPrice, formatPriceWithCap } from '../utils/priceFormatter'
import CardDetail from './CardDetail'

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
  type?: string
  condition?: string
  desirability?: number
  win_count?: number
  loss_count?: number
  flavor_text?: string
  priceHistory?: Array<{ tick: number; price: number; quality_score: number; desirability: number }>
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

  useEffect(() => {
    if (!agentId) {
      setInventory(null)
      return
    }

    // If agents data is provided, use card_instances from it
    if (agents && agents.length > 0) {
      const agent = agents.find((a) => a.id === agentId)
      if (agent && agent.card_instances) {
        // Convert card_instances to inventory format
        const cards = agent.card_instances.map((instance: any) => ({
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
          type: instance.type,
          flavor_text: instance.flavor_text || '',
          condition: instance.condition,
          desirability: instance.desirability,
          win_count: instance.win_count,
          loss_count: instance.loss_count,
        }))
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
          setInventory(data)
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
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Rarity</th>
                <th>Color</th>
                <th>Quality</th>
                <th>Holo</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {displayCards.map((card, idx) => (
                <tr
                  key={idx}
                  className={`rarity-row-${card.rarity.toLowerCase()} card-row-clickable`}
                  onClick={() => setSelectedCard(card)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="card-name">{card.name}</td>
                  <td className={`rarity rarity-${card.rarity.toLowerCase()}`}>{card.rarity}</td>
                  <td className="card-color">{card.color}</td>
                  <td className="quality">{card.quality_score.toFixed(2)}</td>
                  <td className="attribute">{card.is_hologram ? '✓' : '—'}</td>
                  <td className="card-price">{formatPrice(card.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="inventory-footer">Showing {displayCards.length} of {inventory.collection_count} cards</div>

      {selectedCard && <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </div>
  )

}
