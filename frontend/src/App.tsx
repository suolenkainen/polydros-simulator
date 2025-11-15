import React from 'react'
import SimulationRunner from './components/SimulationRunner.tsx'
import AgentList from './components/AgentList.tsx'
import AgentDetail from './components/AgentDetail.tsx'

export default function App() {
  const [selectedAgent, setSelectedAgent] = React.useState<number | null>(null)

  return (
    <div className="container">
      <h1>Polydros — Economy Simulator</h1>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ flex: '1 1 300px' }}>
          <SimulationRunner />
          <AgentList onSelect={(id) => setSelectedAgent(id)} />
        </div>
        <div style={{ flex: '1 1 400px' }}>
          <AgentDetail id={selectedAgent} />
        </div>
      </div>
    </div>
  )
}
