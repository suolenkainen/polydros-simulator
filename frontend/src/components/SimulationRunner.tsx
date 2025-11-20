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
  const [initialized, setInitialized] = useState(false)

  // Load persisted state from sessionStorage on mount
  React.useEffect(() => {
    if (initialized) return // Only run once
    
    const saved = sessionStorage.getItem('simulationRunnerState')
    if (saved) {
      try {
        const state = JSON.parse(saved)
        setSeed(state.seed ?? 42)
        setAgents(state.agents ?? 10)
        setCurrentTick(state.currentTick ?? 0)
        setAllEvents(state.allEvents ?? [])
        setData(state.data ?? null)
        setInitialized(true)
        return
      } catch (err) {
        console.error('Failed to restore simulation runner state:', err)
      }
    }
    
    // If no saved state, initialize normally
    setInitialized(true)
  }, [])

  // Initialize simulation at tick 0 when component mounts (only if not restored from storage)
  React.useEffect(() => {
    if (!initialized) return
    
    // If we have current tick and data, we've been restored from storage
    if (data !== null) {
      if (onWorldSummary && data.length > 0) {
        const last = data[data.length - 1]
        onWorldSummary({
          tick: last.tick,
          agent_count: last.agent_count,
          total_cards: last.total_cards,
          total_unopened_boosters: last.total_unopened_boosters,
        })
      }
      if (onEvents) {
        onEvents(allEvents)
      }
      return
    }
    
    // Otherwise, initialize fresh simulation
    const initializeSimulation = async () => {
      try {
        const res = await runSimulation({ seed, agents, ticks: 0 })
        const series = res.timeseries as TimeseriesPoint[]
        setData(series)
        
        // Display initial world summary
        if (onWorldSummary && series.length > 0) {
          const initial = series[0]
          onWorldSummary({
            tick: initial.tick,
            agent_count: initial.agent_count,
            total_cards: initial.total_cards,
            total_unopened_boosters: initial.total_unopened_boosters,
          })
        }
        if (onEvents) {
          onEvents([])
        }
      } catch (err) {
        console.error('Failed to initialize simulation:', err)
      }
    }
    
    initializeSimulation()
  }, [initialized, onWorldSummary, onEvents, data, allEvents, seed, agents])

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
      const newEvents: SimulationEvent[] = []
      
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
        series.forEach((point) => {
          if (point.events && Array.isArray(point.events)) {
            newEvents.push(...point.events)
          }
        })
        setAllEvents(newEvents)
        onEvents(newEvents)
      }
      
      // Save state to sessionStorage
      const state = {
        seed,
        agents,
        currentTick: nextTick,
        data: series,
        allEvents: newEvents,
      }
      sessionStorage.setItem('simulationRunnerState', JSON.stringify(state))
    } catch (err) {
      console.error(err)
      alert('Failed to run simulation; is backend running at http://127.0.0.1:8000?')
    } finally {
      setLoading(false)
    }
  }

  function onReset() {
    setCurrentTick(0)
    setAllEvents([])
    // Clear persisted state
    sessionStorage.removeItem('simulationRunnerState')
    sessionStorage.removeItem('simulationState')
    // Reinitialize to show tick 0 state with agents
    const reinitialize = async () => {
      try {
        const res = await runSimulation({ seed, agents, ticks: 0 })
        const series = res.timeseries as TimeseriesPoint[]
        setData(series)
        if (onWorldSummary && series.length > 0) {
          const initial = series[0]
          onWorldSummary({
            tick: initial.tick,
            agent_count: initial.agent_count,
            total_cards: initial.total_cards,
            total_unopened_boosters: initial.total_unopened_boosters,
          })
        }
        if (onEvents) {
          onEvents([])
        }
      } catch (err) {
        console.error('Failed to reset simulation:', err)
      }
    }
    reinitialize()
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
