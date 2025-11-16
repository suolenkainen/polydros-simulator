import React from 'react'
import { getAgents } from '../api'

type AgentSummary = {
  id: number
  prism: number
  collection_count: number
}

export default function AgentList({ onSelect }: { onSelect: (id: number) => void }) {
  const [agents, setAgents] = React.useState<AgentSummary[] | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    setLoading(true)
    getAgents()
      .then((res) => {
        setAgents(res.agents || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading agents...</div>
  if (!agents) return <div>No agents available</div>

  return (
    <div className="agent-list">
      <h2>Agents</h2>
      <ul>
        {agents.map((a) => (
          <li key={a.id}>
            <button onClick={() => onSelect(a.id)}>{`Agent ${a.id} — ${a.collection_count} cards — ${a.prism} Prism`}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
