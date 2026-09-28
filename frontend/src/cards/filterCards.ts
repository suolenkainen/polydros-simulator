import type { Card } from './cardApi'

export type CardFilters = {
  search: string
  color: string // '' means any
  type: string
  rarity: string
}

export const NO_FILTERS: CardFilters = { search: '', color: '', type: '', rarity: '' }

export function filterCards(cards: Card[], filters: CardFilters): Card[] {
  const search = filters.search.trim().toLowerCase()
  return cards.filter(
    (card) =>
      (!search || card.name.toLowerCase().includes(search)) &&
      (!filters.color || card.color === filters.color) &&
      (!filters.type || card.type === filters.type) &&
      (!filters.rarity || card.rarity === filters.rarity),
  )
}

// The distinct values of one field, sorted, for a filter's options.
export function distinct(cards: Card[], field: 'color' | 'type'): string[] {
  return Array.from(new Set(cards.map((card) => card[field]))).sort()
}
