import React from 'react'
import { getAgent } from '../api'

export default function AgentDetail({ id }: { id: number | null }) {
  const [player, setPlayer] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (id == null) return
    setLoading(true)
    getAgent(id)
      .then((res) => setPlayer(res.player))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (id == null) return <div>Select an agent to view details</div>
  if (loading) return <div>Loading agent...</div>
  if (!player) return <div>Agent not found</div>

  return (
    <div>
      <h3>Player {player.id}</h3>
      <p>Prism: {player.prism}</p>
      <p>Collection size: {player.collection_count}</p>
      <h4>Sample cards</h4>
      <ul>
        {player.sample_cards && player.sample_cards.map((c: any) => (
          <li key={c.card_id}>{`${c.card_id} — ${c.name} (${c.rarity})${c.is_hologram ? ' [H]' : ''}`}</li>
        ))}
      </ul>
    </div>
  )
}
