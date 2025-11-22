/**
 * Agent behavior logic for buying and selling cards based on traits
 */

export type AgentTrait = 'collector' | 'competitor' | 'gambler' | 'scavenger'

export interface AgentProfile {
  id: number
  primary_trait: AgentTrait
  risk_aversion: number
  time_horizon: number
}

export interface PricePoint {
  tick: number
  price: number
  quality_score: number
  desirability: number
}

/**
 * Determine the agent's primary trait from trait scores
 */
export function getAgentTrait(traits: any): AgentTrait {
  if (!traits) return 'competitor'
  
  const scores = {
    collector: traits.collector_score || 0,
    competitor: traits.competitor_score || 0,
    gambler: traits.gambler_score || 0,
    scavenger: traits.scavenger_score || 0,
  }
  
  return (Object.keys(scores).reduce((a, b) => 
    scores[a as AgentTrait] > scores[b as AgentTrait] ? a : b
  ) as AgentTrait)
}

/**
 * Check if collector would be interested in a card
 * Collectors buy rares and alternate arts
 */
export function isCollectorInterested(rarity: string): boolean {
  return rarity === 'Rare' || rarity === 'Mythic' || rarity === 'Alternate Art'
}

/**
 * Check if competitor would be interested in a card
 * Competitors buy good game cards (high quality, high desirability)
 */
export function isCompetitorInterested(quality: number, desirability: number): boolean {
  // Consider a card good if both quality and desirability are above average
  return quality >= 7.0 && desirability >= 6.0
}

/**
 * Check if gambler would be interested in a card
 * Gamblers buy cards that have raised in value for N ticks
 */
export function isGamblerInterested(priceHistory: PricePoint[], ticks: number = 10): boolean {
  if (!priceHistory || priceHistory.length < 2) return false
  
  // Look at price trend over last N ticks
  const recentHistory = priceHistory.slice(-ticks)
  if (recentHistory.length < 2) return false
  
  const oldPrice = recentHistory[0].price
  const newPrice = recentHistory[recentHistory.length - 1].price
  
  // Consider interested if price has gone up
  return newPrice > oldPrice
}

/**
 * Check if scavenger would be interested in a card
 * Scavengers buy cheap cards
 */
export function isScanvengerInterested(price: number): boolean {
  // Consider cheap if under a threshold (e.g., below 10 prism)
  return price < 10.0
}

/**
 * Calculate quality-to-price ratio (value metric)
 * Higher ratio = better value
 */
export function getValueRatio(quality: number, price: number): number {
  return price > 0 ? quality / price : 0
}

/**
 * Determine if agent should sell based on price trend and ownership preference
 */
export function shouldSell(
  priceHistory: PricePoint[],
  trait: AgentTrait,
  rarity: string
): boolean {
  if (!priceHistory || priceHistory.length < 2) return false
  
  const lastPoint = priceHistory[priceHistory.length - 1]
  const prevPoint = priceHistory[priceHistory.length - 2]
  
  // Everyone sells if price is lowering
  if (lastPoint.price < prevPoint.price) {
    return true
  }
  
  // Specific trait logic for selling
  switch (trait) {
    case 'collector':
      // Collectors sell non-rare cards or when price drops
      return rarity !== 'Rare' && rarity !== 'Mythic' && rarity !== 'Alternate Art'
    
    case 'scavenger':
      // Scavengers never sell (they just accumulate)
      return false
    
    case 'gambler':
      // Gamblers sell if price stops rising
      return lastPoint.price <= prevPoint.price
    
    case 'competitor':
    default:
      // Competitors sell when they don't want it anymore
      // or when price is good (relative to quality)
      return lastPoint.price < prevPoint.price
  }
}
