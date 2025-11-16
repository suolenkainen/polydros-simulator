import React from 'react'

type SimulationEvent = {
  tick: number
  agent_id: number
  event_type: string
  description: string
  agent_ids: number[]
}

type EventsViewProps = {
  events: SimulationEvent[] | null
}

export default function EventsView({ events }: EventsViewProps) {
  const [filter, setFilter] = React.useState<string>('all')
  const [searchTerm, setSearchTerm] = React.useState('')

  if (!events || events.length === 0) {
    return (
      <div className="events-view">
        <h2>Events Log</h2>
        <div className="events-placeholder">No events yet. Run a simulation to see events.</div>
      </div>
    )
  }

  // Filter events by type
  let displayEvents = events
  if (filter !== 'all') {
    displayEvents = displayEvents.filter((e) => e.event_type === filter)
  }
  if (searchTerm) {
    displayEvents = displayEvents.filter((e) => e.description.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  // Get unique event types for filter dropdown
  const eventTypes = Array.from(new Set(events.map((e) => e.event_type)))

  return (
    <div className="events-view">
      <h2>Events Log</h2>

      <div className="events-controls">
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
          <option value="all">All Event Types</option>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {formatEventType(type)}
            </option>
          ))}
        </select>
      </div>

      <div className="events-list">
        {displayEvents.length === 0 ? (
          <div className="events-placeholder">No events match your filters.</div>
        ) : (
          displayEvents.map((event, idx) => (
            <div key={idx} className={`event-item event-type-${event.event_type}`}>
              <div className="event-header">
                <span className="event-tick">T{event.tick}</span>
                <span className={`event-type-badge event-type-badge-${event.event_type}`}>
                  {formatEventType(event.event_type)}
                </span>
              </div>
              <div className="event-description">{event.description}</div>
            </div>
          ))
        )}
      </div>

      <div className="events-footer">Showing {displayEvents.length} of {events.length} events</div>
    </div>
  )
}

function formatEventType(type: string): string {
  const typeMap: Record<string, string> = {
    booster_purchase: 'Booster Purchase',
    card_trade: 'Card Trade',
    card_sale: 'Card Sale',
    match: 'Match',
    booster_open: 'Booster Open',
  }
  return typeMap[type] || type
}
