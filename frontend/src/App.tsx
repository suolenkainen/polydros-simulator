import React from 'react'
import SimulationRunner from './components/SimulationRunner.tsx'
import AgentList from './components/AgentList.tsx'
import AgentDetail from './components/AgentDetail.tsx'
import WorldView from './components/WorldView.tsx'

export default function App() {
  const [selectedAgentId, setSelectedAgentId] = React.useState<number | null>(null)
  const [worldSummary, setWorldSummary] = React.useState<{
    tick: number
    agent_count: number
    total_cards: number
    total_unopened_boosters: number
  } | null>(null)

  return (
    <div className="container">
  <h1>Polydros — Economy Simulator</h1>
  <SimulationRunner onWorldSummary={setWorldSummary} />
  <WorldView summary={worldSummary} />
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: '1 1 300px' }}>
          <AgentList onSelect={setSelectedAgentId} />
        </div>
        <div style={{ flex: '1 1 400px' }}>
          {selectedAgentId !== null && <AgentDetail id={selectedAgentId} />}
        </div>
      </div>
    </div>
  )
}
