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
}

export default function SimulationRunner() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TimeseriesPoint[] | null>(null)
  const [seed, setSeed] = useState<number>(42)
  const [agents, setAgents] = useState<number>(50)
  const [packs, setPacks] = useState<number>(3)
  const [ticks, setTicks] = useState<number>(5)

  async function onRun(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await runSimulation({ seed, agents, packs_per_agent: packs, ticks })
      setData(res.timeseries as TimeseriesPoint[])
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
  <label>Packs per agent <input type="number" value={packs} onChange={(e) => setPacks(Number(e.target.value))} /></label>
        <label>Ticks <input type="number" value={ticks} onChange={(e) => setTicks(Number(e.target.value))} /></label>
        <button type="submit" disabled={loading}>{loading ? 'Running...' : 'Run'}</button>
      </form>

      {data && (
        <div className="chart">
          <Line data={chartData} />
        </div>
      )}
    </div>
  )
}
