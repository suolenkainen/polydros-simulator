import React from 'react'

type WorldSummary = {
  tick: number
  agent_count: number
  total_cards: number
  total_unopened_boosters: number
}

export default function WorldView({ summary }: { summary: WorldSummary | null }) {
  if (!summary) {
    return <div>No world data yet. Run a simulation to see world statistics.</div>
  }

  const totalPacks = summary.total_unopened_boosters + summary.total_cards / 12

  return (
    <div className="world-view">
      <h2>World Overview</h2>
      <ul>
        <li><strong>Tick:</strong> {summary.tick}</li>
        <li><strong>Agents:</strong> {summary.agent_count}</li>
        <li><strong>Total cards opened:</strong> {summary.total_cards}</li>
        <li><strong>Unopened boosters (distributor stock):</strong> {summary.total_unopened_boosters}</li>
        <li><strong>Approx. total boosters created:</strong> {Math.round(totalPacks)}</li>
      </ul>
    </div>
  )
  
}
