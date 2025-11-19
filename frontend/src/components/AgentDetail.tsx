import React from 'react'
import { getAgent } from '../api'
import AgentInventory from './AgentInventory'

interface Traits {
  primary_trait: string
  risk_aversion: string
  time_horizon: string
  collector_trait: number
  competitor_trait: number
  gambler_trait: number
  scavenger_trait: number
}

interface Agent {
  id: number
  prism: number
  collection_count: number
  deck?: Array<{
    card_id: string
    name: string
    type: string
    color: string
    power: number
    health: number
    cost: number
  }>
  traits?: Traits
  agent_events?: Array<{
    tick: number
    agent_id: number
    event_type: string
    description: string
    agent_ids: number[]
  }>
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

  return (
    <div className="agent-detail">
      <h3>Agent {agent.id}</h3>
      <p><strong>Prism:</strong> {agent.prism}</p>
      <p><strong>Collection size:</strong> {agent.collection_count} cards</p>

      {/* Traits Section */}
      {traits && (
        <div className="detail-section">
          <div
            className="detail-section-header"
            onClick={() => toggleSection('traits')}
          >
            {expandedSections.has('traits') ? '▼' : '▶'} Traits & Personality
          </div>
          {expandedSections.has('traits') && (
            <div className="detail-section-content">
              <p><strong>Primary Trait:</strong> {traits.primary_trait}</p>
              <p><strong>Risk Aversion:</strong> {traits.risk_aversion}</p>
              <p><strong>Time Horizon:</strong> {traits.time_horizon}</p>
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ marginBottom: '0.25rem' }}><strong>Trait Scores:</strong></p>
                <div className="trait-scores">
                  <div>
                    <strong>Collector: {(traits.collector_trait * 100).toFixed(1)}%</strong>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: '0.5rem', color: '#666' }}>
                      Probability to purchase packs or high-attraction cards. Rarely plays.
                    </p>
                  </div>
                  <div>
                    <strong>Competitor: {(traits.competitor_trait * 100).toFixed(1)}%</strong>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: '0.5rem', color: '#666' }}>
                      Late purchaser: buys boosters from new sets late and upgrades pack with those cards.
                    </p>
                  </div>
                  <div>
                    <strong>Gambler: {(traits.gambler_trait * 100).toFixed(1)}%</strong>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: '0.5rem', color: '#666' }}>
                      Buys singles with appreciating value. Purchases packs then singles from those sets.
                    </p>
                  </div>
                  <div>
                    <strong>Scavenger: {(traits.scavenger_trait * 100).toFixed(1)}%</strong>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.2rem', marginBottom: '0.5rem', color: '#666' }}>
                      Spends heavily on boosters early (may not open). Buys from other agents before value increases, sells at high price.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deck Section - shown when agent has more than 40 cards */}
      {agent.deck && agent.collection_count > 40 && (
        <div className="detail-section">
          <div
            className="detail-section-header"
            onClick={() => toggleSection('deck')}
          >
            {expandedSections.has('deck') ? '▼' : '▶'} Deck ({agent.deck.length})
          </div>
          {expandedSections.has('deck') && (
            <div className="detail-section-content">
              <table className="deck-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <th style={{ textAlign: 'left', padding: '0.4rem' }}>Name</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', width: '90px' }}>Type</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', width: '80px' }}>Color</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', width: '50px' }}>Power</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', width: '50px' }}>Health</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem', width: '45px' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {agent.deck.map((card, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.4rem' }}>{card.name}</td>
                      <td style={{ textAlign: 'center', padding: '0.4rem' }}>{card.type}</td>
                      <td style={{ textAlign: 'center', padding: '0.4rem' }}>{card.color}</td>
                      <td style={{ textAlign: 'center', padding: '0.4rem' }}>{card.power}</td>
                      <td style={{ textAlign: 'center', padding: '0.4rem' }}>{card.health}</td>
                      <td style={{ textAlign: 'center', padding: '0.4rem' }}>{card.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Agent Events Section */}
      {agent.agent_events && agent.agent_events.length > 0 && (
        <div className="detail-section">
          <div
            className="detail-section-header"
            onClick={() => toggleSection('events')}
          >
            {expandedSections.has('events') ? '▼' : '▶'} Events ({agent.agent_events.length})
          </div>
          {expandedSections.has('events') && (
            <div className="detail-section-content">
              <ul className="agent-events-list">
                {agent.agent_events.map((e, idx) => (
                  <li key={idx} className={`agent-event-type-${e.event_type}`}>
                    <span className="event-tick">T{e.tick}</span>
                    <span className="event-desc">{e.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Full Inventory Section */}
      <AgentInventory agentId={id} />
    </div>
  )
}
