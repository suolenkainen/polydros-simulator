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
  const [currentTick, setCurrentTick] = useState<number>(0)
  const [seed, setSeed] = useState<number>(42)
  const [agents, setAgents] = useState<number>(10)
  const [ticks, setTicks] = useState<number>(1)
  const [allEvents, setAllEvents] = useState<SimulationEvent[]>([])

  async function onRun(e: React.FormEvent) {
    e.preventDefault()
    
    // Validate that ticks is not negative
    if (ticks < 0) {
      alert('Cannot move forward with negative ticks')
      return
    }
    
    if (ticks === 0) {
      alert('Please specify a positive number of ticks to advance')
      return
    }
    
    setLoading(true)
    try {
      // Run simulation from current tick forward
      const nextTick = currentTick + ticks
      const res = await runSimulation({ seed, agents, ticks: nextTick })
      const series = res.timeseries as TimeseriesPoint[]
      setData(series)
      setCurrentTick(nextTick)
      
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
        const newEvents: SimulationEvent[] = []
        series.forEach((point) => {
          if (point.events && Array.isArray(point.events)) {
            newEvents.push(...point.events)
          }
        })
        setAllEvents(newEvents)
        onEvents(newEvents)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to run simulation; is backend running at http://127.0.0.1:8000?')
    } finally {
      setLoading(false)
    }
  }

  function onReset() {
    setData(null)
    setCurrentTick(0)
    setAllEvents([])
    if (onWorldSummary) {
      onWorldSummary({
        tick: 0,
        agent_count: 0,
        total_cards: 0,
        total_unopened_boosters: 0,
      })
    }
    if (onEvents) {
      onEvents([])
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
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Current Tick: {currentTick}</strong>
        </div>
        <label>Seed <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} /></label>
        <label>Agents <input type="number" value={agents} onChange={(e) => setAgents(Number(e.target.value))} /></label>
        <label>Ticks <input type="number" value={ticks} onChange={(e) => setTicks(Number(e.target.value))} min="0" /></label>
        <button type="submit" disabled={loading}>{loading ? 'Running...' : 'Run'}</button>
        <button type="button" onClick={onReset} disabled={loading || currentTick === 0}>Reset</button>
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
