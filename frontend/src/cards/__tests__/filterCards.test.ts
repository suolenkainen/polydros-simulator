import { describe, expect, it } from 'vitest'
import type { Card } from '../cardApi'
import { NO_FILTERS, distinct, filterCards } from '../filterCards'

const card = (id: string, name: string, color: string, type: string, rarity: string): Card => ({
  id,
  name,
  color,
  type,
  rarity,
  labels: [color, type],
  gem_colored: 1,
  gem_colorless: 0,
  power: 1,
  health: 1,
  pack_weight: 1,
  holo_chance: 0.01,
  flavor_text: '',
})

const cards = [
  card('C001', 'Ashmarch Footsoldier', 'Ruby', 'Creature', 'COMMON'),
  card('C002', 'Ember Rite', 'Ruby', 'Spell', 'RARE'),
  card('C003', 'Tide Warden', 'Sapphire', 'Creature', 'RARE'),
]

const ids = (list: Card[]) => list.map((c) => c.id)

describe('filterCards', () => {
  it('returns every card with no filters', () => {
    expect(ids(filterCards(cards, NO_FILTERS))).toEqual(['C001', 'C002', 'C003'])
  })

  it('searches names without caring about case or spaces around the search', () => {
    expect(ids(filterCards(cards, { ...NO_FILTERS, search: '  ember ' }))).toEqual(['C002'])
  })

  it('combines filters', () => {
    const filters = { ...NO_FILTERS, color: 'Ruby', rarity: 'RARE' }
    expect(ids(filterCards(cards, filters))).toEqual(['C002'])
  })

  it('returns nothing when no card matches', () => {
    expect(filterCards(cards, { ...NO_FILTERS, type: 'Golem' })).toEqual([])
  })
})

describe('distinct', () => {
  it('lists each value once, sorted', () => {
    expect(distinct(cards, 'color')).toEqual(['Ruby', 'Sapphire'])
    expect(distinct(cards, 'type')).toEqual(['Creature', 'Spell'])
  })
})
