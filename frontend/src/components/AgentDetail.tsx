import React from 'react'
import { getAgent } from '../api'
import AgentInventory from './AgentInventory'

interface Traits {
  primary_trait: string
  risk_aversion: string
  time_horizon: string
  collector: number
  competitor: number
  gambler: number
  scavenger: number
}

interface Agent {
  id: number
  prism: number
  collection_count: number
  sample_cards: Array<{
    card_id: number
    name: string
    rarity: string
    is_hologram: boolean
  }>
  traits?: Traits
  rarity_breakdown?: Record<string, number>
}

export default function AgentDetail({ id }: { id: number | null }) {
  const [agent, setAgent] = React.useState<Agent | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (id == null) return
    setLoading(true)
    getAgent(id)
      .then((res) => setAgent(res.agent))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  if (id == null) return <div>Select an agent to view details</div>
  if (loading) return <div>Loading agent...</div>
  if (!agent) return <div>Agent not found</div>

  const traits = agent.traits
  const rarityBreakdown = agent.rarity_breakdown || {}

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Agent {agent.id}</h3>
      <p><strong>Prism:</strong> {agent.prism}</p>
      <p><strong>Collection size:</strong> {agent.collection_count} cards</p>

      {/* Traits Section */}
      {traits && (
        <div style={{ marginTop: '1rem', border: '1px solid #ccc', padding: '0.5rem', borderRadius: '4px' }}>
          <div
            style={{ cursor: 'pointer', fontWeight: 'bold', userSelect: 'none' }}
            onClick={() => toggleSection('traits')}
          >
            {expandedSections.has('traits') ? '▼' : '▶'} Traits & Personality
          </div>
          {expandedSections.has('traits') && (
            <div style={{ marginTop: '0.5rem', marginLeft: '1rem' }}>
              <p><strong>Primary Trait:</strong> {traits.primary_trait}</p>
              <p><strong>Risk Aversion:</strong> {traits.risk_aversion}</p>
              <p><strong>Time Horizon:</strong> {traits.time_horizon}</p>
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ marginBottom: '0.25rem' }}><strong>Trait Scores:</strong></p>
                <div style={{ marginLeft: '1rem', fontSize: '0.9rem' }}>
                  <div>Collector: {(traits.collector * 100).toFixed(1)}%</div>
                  <div>Competitor: {(traits.competitor * 100).toFixed(1)}%</div>
                  <div>Gambler: {(traits.gambler * 100).toFixed(1)}%</div>
                  <div>Scavenger: {(traits.scavenger * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rarity Breakdown Section */}
      <div style={{ marginTop: '1rem', border: '1px solid #ccc', padding: '0.5rem', borderRadius: '4px' }}>
        <div
          style={{ cursor: 'pointer', fontWeight: 'bold', userSelect: 'none' }}
          onClick={() => toggleSection('rarity')}
        >
          {expandedSections.has('rarity') ? '▼' : '▶'} Rarity Breakdown
        </div>
        {expandedSections.has('rarity') && (
          <div style={{ marginTop: '0.5rem', marginLeft: '1rem' }}>
            {Object.keys(rarityBreakdown).length > 0 ? (
              <div style={{ fontSize: '0.9rem' }}>
                {Object.entries(rarityBreakdown).map(([rarity, count]) => (
                  <div key={rarity}>{rarity}: {count}</div>
                ))}
              </div>
            ) : (
              <p>No rarity data available</p>
            )}
          </div>
        )}
      </div>

      {/* Sample Cards Section */}
      <div style={{ marginTop: '1rem', border: '1px solid #ccc', padding: '0.5rem', borderRadius: '4px' }}>
        <div
          style={{ cursor: 'pointer', fontWeight: 'bold', userSelect: 'none' }}
          onClick={() => toggleSection('cards')}
        >
          {expandedSections.has('cards') ? '▼' : '▶'} Sample Cards ({agent.sample_cards?.length || 0})
        </div>
        {expandedSections.has('cards') && (
          <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
            {agent.sample_cards && agent.sample_cards.map((c) => (
              <li key={c.card_id}>
                {c.name} <span style={{ fontSize: '0.85rem', color: '#666' }}>({c.rarity}){c.is_hologram ? ' [Hologram]' : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Full Inventory Section */}
      <AgentInventory agentId={id} />
    </div>
  )
}
