import React from 'react'
import SimulationRunner from './components/SimulationRunner.tsx'
import AgentList from './components/AgentList.tsx'
import AgentDetail from './components/AgentDetail.tsx'
import WorldView from './components/WorldView.tsx'
import EventsView from './components/EventsView.tsx'

export default function App() {
  const [selectedAgentId, setSelectedAgentId] = React.useState<number | null>(null)
  const [worldSummary, setWorldSummary] = React.useState<{
    tick: number
    agent_count: number
    total_cards: number
    total_unopened_boosters: number
  } | null>(null)
  const [events, setEvents] = React.useState<Array<{
    tick: number
    agent_id: number
    event_type: string
    description: string
    agent_ids: number[]
  }> | null>(null)

  return (
    <div className="container">
      <h1>Polydros — Economy Simulator</h1>
      <SimulationRunner onWorldSummary={setWorldSummary} onEvents={setEvents} />
      <WorldView summary={worldSummary} />
      <EventsView events={events} />
      <div className="app-layout">
        <div className="app-layout-column">
          <AgentList onSelect={setSelectedAgentId} />
        </div>
        <div className="app-layout-column-large">
          {selectedAgentId !== null && <AgentDetail id={selectedAgentId} />}
        </div>
      </div>
    </div>
  )
}
