import React from 'react'
import CardBrowser from './cards/CardBrowser'
import OldSimulationPage from './components/OldSimulationPage'

// Two tabs while the redesign is under way: the new card browser, and the old
// simulation page. The tab is kept in the URL (#cards, #old-simulation) so a
// reload stays on the same one. Only the open tab is mounted, so the old page
// doesn't start a simulation run unless it's opened.
const TABS = [
  { id: 'cards', label: 'Cards' },
  { id: 'old-simulation', label: 'Old simulation' },
] as const

type TabId = (typeof TABS)[number]['id']

function tabFromHash(): TabId {
  const hash = window.location.hash.slice(1)
  return TABS.some((t) => t.id === hash) ? (hash as TabId) : 'cards'
}

export default function App() {
  const [tab, setTab] = React.useState<TabId>(tabFromHash)

  React.useEffect(() => {
    const onHashChange = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <div className="container">
      <h1>Polydros</h1>
      <nav className="tabs">
        {TABS.map((t) => (
          <a key={t.id} href={`#${t.id}`} aria-current={t.id === tab ? 'page' : undefined}>
            {t.label}
          </a>
        ))}
      </nav>
      {tab === 'cards' ? <CardBrowser /> : <OldSimulationPage />}
    </div>
  )
}
