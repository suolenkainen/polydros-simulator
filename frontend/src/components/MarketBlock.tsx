import React, { useState } from 'react'
import { formatPrice } from '../utils/priceFormatter'
import { getGemColorInfo, getContrastingTextColor } from '../utils/gemColors'

type MarketCard = {
  card_instance_id: string
  card_id: string
  card_name: string
  card_color: string
  card_rarity: string
  agent_id: number
  agent_name: string
  current_price: number
  quality_score: number
  desirability: number
  condition: string
}

type MarketBlockProps = {
  agents?: any[]
}

export default function MarketBlock({ agents }: MarketBlockProps) {
  const [filterRarity, setFilterRarity] = useState<string>('all')
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'name' | 'quality'>('price-low')
  const [currentPage, setCurrentPage] = useState(1)
  const cardsPerPage = 8

  // Generate test data for development
  const generateTestData = (): MarketCard[] => {
    const testCards: MarketCard[] = [
      {
        card_instance_id: 'test-1',
        card_id: 'ruby-warrior-001',
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
        card_id: 'sapphire-mage-002',
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
        card_id: 'emerald-druid-003',
        card_name: 'Forest Guardian',
        card_color: 'Emerald',
        card_rarity: 'Uncommon',
        agent_id: 0,
        agent_name: 'Agent 0',
        current_price: 12.25,
        quality_score: 6.2,
        desirability: 5.8,
        condition: 'played',
      },
      {
        card_instance_id: 'test-4',
        card_id: 'topaz-knight-004',
        card_name: 'Golden Knight',
        card_color: 'Topaz',
        card_rarity: 'Rare',
        agent_id: 0,
        agent_name: 'Agent 0',
        current_price: 38.75,
        quality_score: 8.1,
        desirability: 6.9,
        condition: 'mint',
      },
      {
        card_instance_id: 'test-5',
        card_id: 'amethyst-sorcerer-005',
        card_name: 'Void Sorcerer',
        card_color: 'Amethyst',
        card_rarity: 'Rare',
        agent_id: 0,
        agent_name: 'Agent 0',
        current_price: 55.0,
        quality_score: 8.7,
        desirability: 7.5,
        condition: 'mint',
      },
      {
        card_instance_id: 'test-6',
        card_id: 'diamond-artifact-006',
        card_name: 'Crystal Artifact',
        card_color: 'Diamond',
        card_rarity: 'Common',
        agent_id: 0,
        agent_name: 'Agent 0',
        current_price: 2.5,
        quality_score: 4.0,
        desirability: 3.2,
        condition: 'damaged',
      },
      {
        card_instance_id: 'test-7',
        card_id: 'ruby-dragon-007',
        card_name: 'Ancient Dragon',
        card_color: 'Ruby',
        card_rarity: 'Mythic',
        agent_id: 0,
        agent_name: 'Agent 0',
        current_price: 189.99,
        quality_score: 10.0,
        desirability: 9.9,
        condition: 'mint',
      },
      {
        card_instance_id: 'test-8',
        card_id: 'sapphire-common-008',
        card_name: 'Water Sprite',
        card_color: 'Sapphire',
        card_rarity: 'Common',
        agent_id: 0,
        agent_name: 'Agent 0',
        current_price: 1.75,
        quality_score: 3.8,
        desirability: 2.5,
        condition: 'worn',
      },
      {
        card_instance_id: 'test-9',
        card_id: 'emerald-common-009',
        card_name: 'Forest Sprite',
        card_color: 'Emerald',
        card_rarity: 'Common',
        agent_id: 0,
        agent_name: 'Agent 0',
        current_price: 2.0,
        quality_score: 4.2,
        desirability: 3.1,
        condition: 'played',
      },
      {
        card_instance_id: 'test-10',
        card_id: 'topaz-uncommon-010',
        card_name: 'Solar Flare',
        card_color: 'Topaz',
        card_rarity: 'Uncommon',
        agent_id: 0,
        agent_name: 'Agent 0',
        current_price: 8.5,
        quality_score: 5.9,
        desirability: 5.2,
        condition: 'played',
      },
      {
        card_instance_id: 'test-11',
        card_id: 'amethyst-uncommon-011',
        card_name: 'Shadow Clone',
        card_color: 'Amethyst',
        card_rarity: 'Uncommon',
        agent_id: 0,
        agent_name: 'Agent 0',
        current_price: 11.0,
        quality_score: 6.5,
        desirability: 6.1,
        condition: 'mint',
      },
      {
        card_instance_id: 'test-12',
        card_id: 'obsidian-rare-012',
        card_name: 'Shadow Assassin',
        card_color: 'Obsidian',
        card_rarity: 'Rare',
        agent_id: 0,
        agent_name: 'Agent 0',
        current_price: 42.0,
        quality_score: 7.8,
        desirability: 6.8,
        condition: 'mint',
      },
    ]
    return testCards
  }

  // Generate market cards from real agent data
  // Cards are listed for sale when feasibility goes down or agent decides to sell
  const getMarketCards = (): MarketCard[] => {
    if (!agents || agents.length === 0) {
      console.log('[MarketBlock] No agents provided, using test data')
      return generateTestData()
    }

    console.log('[MarketBlock] Using real agent data - collecting cards for sale from all agents')
    const cardsForSale: MarketCard[] = []

    // Iterate through all agents and collect their cards that are for sale
    for (const agent of agents) {
      if (agent.card_instances && typeof agent.card_instances === 'object') {
        // Handle both array and object formats
        const instancesArray = Array.isArray(agent.card_instances)
          ? agent.card_instances
          : Object.values(agent.card_instances)

        for (const instance of instancesArray) {
          // Cards are for sale if they have a price (not feasibility-based anymore)
          // In real data, cards with declining feasibility are already converted to market cards with prices
          if (instance && instance.current_price !== undefined) {
            cardsForSale.push({
              card_instance_id: instance.card_instance_id || `card-${agent.id}-${Math.random()}`,
              card_id: instance.card_id,
              card_name: instance.card_name,
              card_color: instance.card_color,
              card_rarity: instance.card_rarity,
              agent_id: agent.id,
              agent_name: `Agent ${agent.id}`,
              current_price: instance.current_price,
              quality_score: instance.quality_score,
              desirability: instance.desirability,
              condition: instance.condition,
            })
          }
        }
      }
    }

    console.log(`[MarketBlock] Found ${cardsForSale.length} cards for sale`)
    return cardsForSale.length > 0 ? cardsForSale : generateTestData()
  }

  const marketCards = getMarketCards()

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filterRarity, filterAgent, searchTerm, sortBy])

  // Filter and sort cards
  let displayCards = marketCards
  if (filterRarity !== 'all') {
    displayCards = displayCards.filter((c) => c.card_rarity === filterRarity)
  }
  if (filterAgent !== 'all') {
    displayCards = displayCards.filter((c) => c.agent_id.toString() === filterAgent)
  }
  if (searchTerm) {
    displayCards = displayCards.filter((c) => c.card_name.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  if (sortBy === 'price-low') {
    displayCards = [...displayCards].sort((a, b) => a.current_price - b.current_price)
  } else if (sortBy === 'price-high') {
    displayCards = [...displayCards].sort((a, b) => b.current_price - a.current_price)
  } else if (sortBy === 'name') {
    displayCards = [...displayCards].sort((a, b) => a.card_name.localeCompare(b.card_name))
  } else if (sortBy === 'quality') {
    displayCards = [...displayCards].sort((a, b) => b.quality_score - a.quality_score)
  }

  // Get unique rarities and agents for filter dropdowns
  const rarities = Array.from(new Set(marketCards.map((c) => c.card_rarity))).sort()
  const agents_in_market = Array.from(new Set(marketCards.map((c) => c.agent_id))).sort()

  const getRarityColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      Mythic: '#9c3c0f',
      Rare: '#3c6382',
      Uncommon: '#2d5016',
      Common: '#666666',
      Player: '#6b3b8a',
      'Alternate Art': '#c2a000',
    }
    return colors[rarity] || '#999'
  }

  // Calculate pagination
  const totalPages = Math.ceil(displayCards.length / cardsPerPage)
  const startIdx = (currentPage - 1) * cardsPerPage
  const paginatedCards = displayCards.slice(startIdx, startIdx + cardsPerPage)

  if (marketCards.length === 0) {
    return (
      <div className="market-block">
        <h2>Market</h2>
        <div className="market-placeholder">No cards currently for sale.</div>
      </div>
    )
  }

  return (
    <div className="market-block">
      <h2>Market</h2>
      <p className="market-subtitle">Cards available for purchase from agents</p>

      <div className="market-controls">
        <input
          type="text"
          placeholder="Search card name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} className="filter-select">
          <option value="all">All Rarities</option>
          {rarities.map((rarity) => (
            <option key={rarity} value={rarity}>
              {rarity}
            </option>
          ))}
        </select>

        <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="filter-select">
          <option value="all">All Sellers</option>
          {agents_in_market.map((agentId) => (
            <option key={agentId} value={agentId.toString()}>
              Agent {agentId}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'price-low' | 'price-high' | 'name' | 'quality')} className="filter-select">
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="name">Name</option>
          <option value="quality">Quality: High → Low</option>
        </select>
      </div>

      <div className="market-grid">
        {displayCards.length === 0 ? (
          <div className="market-no-results">No cards match your filters.</div>
        ) : (
          paginatedCards.map((card) => (
            <div key={card.card_instance_id} className="market-card">
              <div className="market-card-header">
                <h4 className="market-card-name">{card.card_name}</h4>
                <span className="market-card-price">{formatPrice(card.current_price)}</span>
              </div>

              <div className="market-card-meta">
                <span className="market-rarity" style={{ backgroundColor: getRarityColor(card.card_rarity), color: 'white' }}>
                  {card.card_rarity}
                </span>
                {(() => {
                  const colorInfo = getGemColorInfo(card.card_color)
                  const textColor = getContrastingTextColor(colorInfo.hexColor)
                  return (
                    <span className="market-color-gem" style={{ backgroundColor: colorInfo.hexColor, color: textColor }}>
                      <span className="gem-icon">{colorInfo.icon}</span> {card.card_color}
                    </span>
                  )
                })()}
                <span className="market-condition">{card.condition}</span>
              </div>

              <div className="market-card-stats">
                <div className="stat">
                  <span className="stat-label">Quality</span>
                  <span className="stat-value">{card.quality_score.toFixed(1)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Desirability</span>
                  <span className="stat-value">{card.desirability.toFixed(1)}</span>
                </div>
              </div>

              <div className="market-card-seller">
                <span>Seller: {card.agent_name}</span>
              </div>

              <button className="market-card-buy">Buy Now</button>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="market-pagination">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}

      <div className="market-footer">
        Showing {paginatedCards.length} of {displayCards.length} cards (filtered from {marketCards.length} total)
      </div>

      <style>{`
        .market-block {
          background: #fff;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          margin-bottom: 2rem;
        }

        .market-block h2 {
          margin-top: 0;
          margin-bottom: 0.5rem;
        }

        .market-subtitle {
          margin: 0 0 1.5rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .market-placeholder {
          padding: 40px;
          text-align: center;
          color: #999;
          font-style: italic;
          background: #fafafa;
          border-radius: 4px;
          border: 1px solid #e5e5e5;
        }

        .market-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .market-controls .search-input,
        .market-controls .filter-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
          background: white;
        }

        .market-controls .search-input {
          flex: 1;
          min-width: 200px;
        }

        .market-controls .search-input:focus,
        .market-controls .filter-select:focus {
          outline: none;
          border-color: #4a9eff;
          box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
        }

        .market-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 15px;
          margin-bottom: 1.5rem;
        }

        .market-no-results {
          grid-column: 1 / -1;
          padding: 30px;
          text-align: center;
          color: #999;
          background: #fafafa;
          border-radius: 4px;
          border: 1px solid #e5e5e5;
        }

        .market-card {
          background: #fafafa;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .market-card:hover {
          border-color: #4a9eff;
          box-shadow: 0 4px 12px rgba(74, 158, 255, 0.15);
          transform: translateY(-2px);
        }

        .market-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .market-card-name {
          margin: 0;
          font-size: 1rem;
          color: #333;
          font-weight: 600;
          flex: 1;
        }

        .market-card-price {
          font-size: 1.1rem;
          font-weight: 700;
          color: #2d7a3a;
          white-space: nowrap;
        }

        .market-card-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .market-rarity {
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .market-color {
          font-size: 0.85rem;
          color: #666;
          background: #f0f0f0;
          padding: 3px 8px;
          border-radius: 3px;
        }

        .market-color-gem {
          font-size: 0.85rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .gem-icon {
          font-size: 0.9rem;
          font-weight: bold;
        }

        .market-condition {
          font-size: 0.8rem;
          color: #999;
          text-transform: capitalize;
        }

        .market-card-stats {
          display: flex;
          gap: 15px;
          padding-top: 8px;
          border-top: 1px solid #ddd;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #999;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 3px;
        }

        .stat-value {
          font-size: 1rem;
          font-weight: 700;
          color: #333;
        }

        .market-card-seller {
          font-size: 0.85rem;
          color: #666;
          padding: 8px;
          background: #fff;
          border-radius: 3px;
          border: 1px dashed #ddd;
        }

        .market-card-buy {
          padding: 10px 15px;
          background: #4a9eff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .market-card-buy:hover {
          background: #357abd;
          box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3);
        }

        .market-card-buy:active {
          transform: scale(0.98);
        }

        .market-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin: 1.5rem 0 0 0;
          padding: 1rem 0;
          border-top: 1px solid #e5e5e5;
        }

        .pagination-btn {
          padding: 8px 12px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #4a9eff;
          color: white;
          border-color: #4a9eff;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
          min-width: 100px;
          text-align: center;
        }

        .market-footer {
          padding: 10px 12px;
          font-size: 0.85rem;
          color: #999;
          text-align: right;
          border-top: 1px solid #e5e5e5;
        }

        @media (max-width: 768px) {
          .market-controls {
            flex-direction: column;
          }

          .market-controls .search-input,
          .market-controls .filter-select {
            width: 100%;
          }

          .market-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }
      `}</style>
    </div>
  )
}
