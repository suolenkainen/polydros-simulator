import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import CardBrowser from '../CardBrowser'

const cards = [
  {
    id: 'C001',
    name: 'Ashmarch Footsoldier',
    rarity: 'COMMON',
    color: 'Ruby',
    type: 'Creature',
    labels: ['Ruby', 'Creature'],
    gem_colored: 1,
    gem_colorless: 0,
    power: 1,
    health: 3,
    pack_weight: 18.37,
    holo_chance: 0.01837,
    flavor_text: 'The ash remembers every trespass.',
  },
  {
    id: 'C017',
    name: 'Ramdelom’s Heart-Titan',
    rarity: 'MYTHIC',
    color: 'Ruby',
    type: 'Golem',
    labels: ['Ruby', 'Golem'],
    gem_colored: 2,
    gem_colorless: 3,
    power: 5,
    health: 5,
    pack_weight: 1.04,
    holo_chance: 0.00104,
    flavor_text: '',
  },
]

function fakeBackend(response: Response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CardBrowser', () => {
  it('shows every card from the API with its thumbnail', async () => {
    fakeBackend(new Response(JSON.stringify({ cards })))
    render(<CardBrowser />)

    expect(await screen.findByText('Ashmarch Footsoldier')).toBeInTheDocument()
    expect(screen.getByText('Ramdelom’s Heart-Titan')).toBeInTheDocument()
    expect(screen.getByText('2 of 2 cards')).toBeInTheDocument()
    const thumbs = document.querySelectorAll('.card-tile img')
    expect(thumbs[0].getAttribute('src')).toBe('http://127.0.0.1:8420/cards/C001/thumb')
  })

  it('narrows the grid with a filter', async () => {
    fakeBackend(new Response(JSON.stringify({ cards })))
    render(<CardBrowser />)
    await screen.findByText('Ashmarch Footsoldier')

    fireEvent.change(screen.getByLabelText('Rarity'), { target: { value: 'MYTHIC' } })

    expect(screen.queryByText('Ashmarch Footsoldier')).not.toBeInTheDocument()
    expect(screen.getByText('1 of 2 cards')).toBeInTheDocument()
  })

  it('opens the full card on click and closes it with Escape', async () => {
    fakeBackend(new Response(JSON.stringify({ cards })))
    render(<CardBrowser />)
    fireEvent.click(await screen.findByText('Ashmarch Footsoldier'))

    const dialog = screen.getByRole('dialog', { name: 'Ashmarch Footsoldier' })
    expect(dialog).toHaveTextContent('The ash remembers every trespass.')
    expect(dialog).toHaveTextContent('Ruby, Creature')
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe(
      'http://127.0.0.1:8420/cards/C001/image',
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('says so when the backend is not reachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))
    render(<CardBrowser />)

    expect(await screen.findByText(/Couldn't load the cards: Failed to fetch/)).toBeInTheDocument()
  })
})
