// Where the backend runs. Every call to it builds on this.
export const API_BASE = 'http://127.0.0.1:8420'

export async function runSimulation(body: { seed: number; agents: number; ticks: number; }) {
  const res = await fetch(`${API_BASE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function getAgents() {
  const res = await fetch(`${API_BASE}/agents`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

export async function getAgent(id: number) {
  const res = await fetch(`${API_BASE}/agents/${id}`)
  if (!res.ok) throw new Error('API error')
  return res.json()
}
