export async function runSimulation(body: { seed: number; players: number; packs_per_player: number; ticks: number; }) {
  const res = await fetch('http://127.0.0.1:8000/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function getAgents() {
  const res = await fetch('http://127.0.0.1:8000/agents')
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function getAgent(id: number) {
  const res = await fetch(`http://127.0.0.1:8000/agents/${id}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}
