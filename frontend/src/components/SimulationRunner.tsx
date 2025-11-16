import React, { useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { runSimulation } from '../api.ts'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

type TimeseriesPoint = {
  tick: number
  agent_count: number
  total_cards: number
  total_unopened_boosters: number
  events?: Array<{
    tick: number
    agent_id: number
    event_type: string
    description: string
    agent_ids: number[]
  }>
}

type WorldSummary = {
  tick: number
  agent_count: number
  total_cards: number
  total_unopened_boosters: number
}

type SimulationEvent = {
  tick: number
  agent_id: number
  event_type: string
  description: string
  agent_ids: number[]
}

export default function SimulationRunner({
  onWorldSummary,
  onEvents,
}: {
  onWorldSummary?: (summary: WorldSummary) => void
  onEvents?: (events: SimulationEvent[]) => void
}) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TimeseriesPoint[] | null>(null)
  const [seed, setSeed] = useState<number>(42)
  const [agents, setAgents] = useState<number>(10)
  const [ticks, setTicks] = useState<number>(1)

  async function onRun(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await runSimulation({ seed, agents, ticks })
      const series = res.timeseries as TimeseriesPoint[]
      setData(series)
      // Use the last timeseries point as the current world summary
      if (onWorldSummary && series.length > 0) {
        const last = series[series.length - 1]
        onWorldSummary({
          tick: last.tick,
          agent_count: last.agent_count,
          total_cards: last.total_cards,
          total_unopened_boosters: last.total_unopened_boosters,
        })
      }
      // Collect all events from all ticks
      if (onEvents) {
        const allEvents: SimulationEvent[] = []
        series.forEach((point) => {
          if (point.events && Array.isArray(point.events)) {
            allEvents.push(...point.events)
          }
        })
        onEvents(allEvents)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to run simulation; is backend running at http://127.0.0.1:8000?')
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: data ? data.map((p) => `T${p.tick}`) : [],
    datasets: [
      {
        label: 'Total Cards',
        data: data ? data.map((p) => p.total_cards) : [],
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.3,
      },
      {
  label: 'Agent Count',
        data: data ? data.map((p) => p.agent_count) : [],
        borderColor: 'rgba(192,75,192,1)',
        tension: 0.3,
      },
    ],
  }

  return (
    <div>
      <form onSubmit={onRun} className="form">
        <label>Seed <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} /></label>
        <label>Agents <input type="number" value={agents} onChange={(e) => setAgents(Number(e.target.value))} /></label>
        <label>Ticks <input type="number" value={ticks} onChange={(e) => setTicks(Number(e.target.value))} /></label>
        <button type="submit" disabled={loading}>{loading ? 'Running...' : 'Run'}</button>
      </form>

      {/* Chart temporarily disabled; world view will surface aggregate stats instead */}
      {/* {data && (
        <div className="chart">
          <Line data={chartData} />
        </div>
      )} */}
    </div>
  )
}
