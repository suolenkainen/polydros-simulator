// The card set, as served by the backend (polydros/api.py). This is the only
// place the frontend gets card data from; there is no copy of the card list
// in the frontend.

import { API_BASE } from '../api'

export type Card = {
  id: string
  name: string
  rarity: string
  color: string
  type: string
  labels: string[]
  gem_colored: number
  gem_colorless: number
  power: number
  health: number
  pack_weight: number
  holo_chance: number
  flavor_text: string
}

export async function fetchCards(): Promise<Card[]> {
  const res = await fetch(`${API_BASE}/cards`)
  if (!res.ok) throw new Error(`Loading cards failed (${res.status})`)
  const data = await res.json()
  return data.cards
}

export const cardImageUrl = (id: string) => `${API_BASE}/cards/${id}/image`
export const cardThumbUrl = (id: string) => `${API_BASE}/cards/${id}/thumb`

const RARITY_NAMES: Record<string, string> = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  MYTHIC: 'Mythic',
  PLAYER: 'Player',
  ALTERNATE_ART: 'Alternate Art',
}

// In pack order, rarest last, for the rarity filter.
export const RARITY_ORDER = Object.keys(RARITY_NAMES)

export const rarityName = (rarity: string) => RARITY_NAMES[rarity] ?? rarity
