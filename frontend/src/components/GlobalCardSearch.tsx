import React, { useEffect, useState } from 'react'
import CardDetail from './CardDetail'
import { formatPrice } from '../utils/priceFormatter'

type PriceDataPoint = {
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
  priceHistory?: PriceDataPoint[]
  agent_id?: number
  card_instance_id?: string
}

type CardSearchResult = {
  card: Card
  agent_id: number
  agent_name: string
  instance_count: number
}

interface GlobalCardSearchProps {
  agents?: any[]
}

export default function GlobalCardSearch({ agents }: GlobalCardSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<CardSearchResult[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(false)

  // Search for cards by name across all agents
  const performSearch = () => {
    if (!searchTerm.trim() || !agents || agents.length === 0) {
      setResults([])
      return
    }

    const allResults: CardSearchResult[] = []
    const searchLower = searchTerm.toLowerCase()

    agents.forEach((agent) => {
      const card_instances = agent.card_instances || []
      const matchingCards = card_instances.filter((instance: any) =>
        (instance.card_name || '').toLowerCase().includes(searchLower)
      )

      // Group by card name to show aggregated results
      matchingCards.forEach((instance: any) => {
        const card: Card = {
          card_id: instance.card_id,
          name: instance.card_name || 'Unknown Card',
          color: instance.card_color || '',
          rarity: instance.card_rarity || '',
          is_hologram: instance.is_hologram || false,
          quality_score: instance.quality_score || 0,
          price: instance.current_price || 0,
          attractiveness: instance.desirability || 0,
          priceHistory: instance.price_history || [],
          power: instance.power,
          health: instance.health,
          gem_colored: instance.gem_colored || 0,
          gem_colorless: instance.gem_colorless || 0,
          flavor_text: instance.flavor_text || '',
          desirability: instance.desirability,
          agent_id: agent.id,
        }

        allResults.push({
          card,
          agent_id: agent.id,
          agent_name: agent.name || `Agent ${agent.id}`,
          instance_count: 1,
        })
      })
    })

    setResults(allResults)
  }

  useEffect(() => {
    performSearch()
  }, [searchTerm, agents])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch()
    }
  }

  // Get unique cards and aggregate stats
  const aggregatedCards: Record<string, { card: Card; agents: number; instances: number; avgPrice: number }> = {}
  results.forEach(({ card, agent_id }) => {
    const key = `${card.card_id}-${agent_id}`
    if (!aggregatedCards[key]) {
      aggregatedCards[key] = {
        card,
        agents: 1,
        instances: 1,
        avgPrice: card.price,
      }
    } else {
      aggregatedCards[key].instances += 1
      aggregatedCards[key].avgPrice = (aggregatedCards[key].avgPrice + card.price) / 2
    }
  })

  const uniqueResults = Object.values(aggregatedCards)

  return (
    <div className="global-card-search">
      <div className="search-section">
        <h3>🔍 Search All Card Collections</h3>
        <p className="search-description">Search for any card across all agents and view its price history</p>

        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search card name (e.g., 'Alloyed Guardian')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="global-search-input"
            autoFocus
          />
          <button onClick={performSearch} className="search-button">
            Search
          </button>
        </div>

        {searchTerm && (
          <div className="search-stats">
            Found <strong>{uniqueResults.length}</strong> matching card instance(s)
          </div>
        )}
      </div>

      {uniqueResults.length > 0 && (
        <div className="search-results">
          <table className="search-results-table">
            <thead>
              <tr>
                <th>Card Name</th>
                <th>Agent</th>
                <th>Rarity</th>
                <th>Color</th>
                <th>Current Price</th>
                <th>Quality</th>
                <th>Price History</th>
              </tr>
            </thead>
            <tbody>
              {uniqueResults.map((result, idx) => {
                const { card, instances } = result
                const historyLength = card.priceHistory?.length || 0
                const agentName = `Agent ${card.agent_id}`
                return (
                  <tr
                    key={idx}
                    className={`search-result-row rarity-row-${card.rarity.toLowerCase()}`}
                    onClick={() => setSelectedCard(card)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="card-name">{card.name}</td>
                    <td className="agent-name">{agentName}</td>
                    <td className={`rarity rarity-${card.rarity.toLowerCase()}`}>{card.rarity}</td>
                    <td className="card-color">{card.color}</td>
                    <td className="card-price">{formatPrice(card.price)}</td>
                    <td className="quality">{card.quality_score.toFixed(2)}</td>
                    <td className="price-history-badge">
                      {historyLength > 0 ? (
                        <span className="history-indicator" title={`${historyLength} data points`}>
                          📈 {historyLength} pts
                        </span>
                      ) : (
                        <span className="no-history">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {searchTerm && uniqueResults.length === 0 && (
        <div className="no-results">
          <p>No cards found matching "{searchTerm}"</p>
          <p className="no-results-hint">Try a different search term</p>
        </div>
      )}

      {selectedCard && <CardDetail card={selectedCard} onClose={() => setSelectedCard(null)} />}

      <style>{`
        .global-card-search {
          padding: 20px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .search-section {
          margin-bottom: 20px;
        }

        .search-section h3 {
          margin: 0 0 8px 0;
          color: #fff;
          font-size: 18px;
        }

        .search-description {
          color: #aaa;
          font-size: 14px;
          margin: 0 0 15px 0;
        }

        .search-input-container {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .global-search-input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #444;
          border-radius: 4px;
          background: #222;
          color: #fff;
          font-size: 14px;
        }

        .global-search-input:focus {
          outline: none;
          border-color: #4CAF50;
          box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
        }

        .search-button {
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .search-button:hover {
          background: #45a049;
        }

        .search-stats {
          color: #aaa;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .search-results {
          margin-top: 15px;
        }

        .search-results-table {
          width: 100%;
          border-collapse: collapse;
          background: #1a1a2e;
          border: 1px solid #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .search-results-table thead {
          background: #16213e;
          border-bottom: 2px solid #333;
        }

        .search-results-table th {
          padding: 12px;
          text-align: left;
          color: #aaa;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .search-results-table tbody tr {
          border-bottom: 1px solid #222;
          transition: background 0.2s;
        }

        .search-results-table tbody tr:hover {
          background: #252542;
        }

        .search-result-row {
          cursor: pointer;
        }

        .search-results-table td {
          padding: 12px;
          color: #ddd;
          font-size: 13px;
        }

        .card-name {
          font-weight: 500;
          color: #fff;
        }

        .agent-name {
          color: #aaa;
          font-size: 12px;
        }

        .price-history-badge {
          text-align: center;
        }

        .history-indicator {
          display: inline-block;
          background: #4CAF50;
          color: white;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 500;
        }

        .no-history {
          color: #666;
        }

        .no-results {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }

        .no-results-hint {
          font-size: 12px;
          margin-top: 10px;
          color: #666;
        }

        /* Rarity colors */
        .rarity-mythic {
          background: rgba(156, 60, 15, 0.1);
        }

        .rarity-rare {
          background: rgba(60, 99, 130, 0.1);
        }

        .rarity-uncommon {
          background: rgba(45, 80, 22, 0.1);
        }

        .rarity {
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 11px;
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
          background: #555;
          color: white;
        }

        .rarity-player {
          background: #6b3b8a;
          color: white;
        }

        .rarity-alternate-art {
          background: #c2a000;
          color: white;
        }
      `}</style>
    </div>
  )
}
