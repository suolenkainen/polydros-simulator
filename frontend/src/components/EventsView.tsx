import React from 'react'
import { usePagination } from '../hooks/usePagination'

type SimulationEvent = {
  tick: number
  agent_id: number
  event_type: string
  description: string
  agent_ids: number[]
  triggered?: boolean | null
}

type EventsViewProps = {
  events: SimulationEvent[] | null
}

export default function EventsView({ events }: EventsViewProps) {
  const [filter, setFilter] = React.useState<string>('all')
  const [searchTerm, setSearchTerm] = React.useState('')

  // Filter events by type
  let displayEvents = events || []
  if (filter !== 'all') {
    displayEvents = displayEvents.filter((e) => e.event_type === filter)
  }
  if (searchTerm) {
    displayEvents = displayEvents.filter((e) => e.description.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  // Get unique event types for filter dropdown
  const eventTypes = events ? Array.from(new Set(events.map((e) => e.event_type))) : []

  // Use pagination hook with reset dependencies (must be called at top level before any conditional returns)
  const pagination = usePagination(displayEvents.length, {
    initialPageSize: 25,
    resetDependencies: [filter, searchTerm],
  })

  if (!events || events.length === 0) {
    return (
      <div className="events-view">
        <h2>Events Log</h2>
        <div className="events-placeholder">No events yet. Run a simulation to see events.</div>
      </div>
    )
  }

  const paginatedEvents = displayEvents.slice(pagination.startIdx, pagination.endIdx)

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

        <select
          value={pagination.pageSize.toString()}
          onChange={(e) => pagination.setPageSize(parseInt(e.target.value))}
          className="filter-select"
        >
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
        </select>
      </div>

      <div className="events-list">
        {paginatedEvents.length === 0 ? (
          <div className="events-placeholder">No events match your filters.</div>
        ) : (
          paginatedEvents.map((event, idx) => {
            // Determine triggered state class
            let triggeredClass = ''
            if (event.triggered === true) {
              triggeredClass = 'event-triggered-true'
            } else if (event.triggered === false) {
              // Check if it's a combat loss (event type is combat and triggered is false, viewed from loser's perspective)
              // Since we log combat from winner's perspective, we need to check if agent lost
              // For now, mark non-triggered events as false (orange)
              triggeredClass = 'event-triggered-false'
            }
            
            return (
              <div key={idx} className={`event-item event-type-${event.event_type} ${triggeredClass}`}>
                <div className="event-header">
                  <span className="event-tick">T{event.tick}</span>
                  <span className={`event-type-badge event-type-badge-${event.event_type}`}>
                    {formatEventType(event.event_type)}
                  </span>
                </div>
                <div className="event-description">{event.description}</div>
              </div>
            )
          })
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="events-pagination">
          <button 
            onClick={() => pagination.previousPage()}
            disabled={pagination.currentPage === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages} ({displayEvents.length} total)
          </span>
          <button 
            onClick={() => pagination.nextPage()}
            disabled={pagination.currentPage === pagination.totalPages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}

      <div className="events-footer">Showing {paginatedEvents.length} of {displayEvents.length} events (filtered from {events.length} total)</div>
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
