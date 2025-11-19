/**
 * Format card prices with specific rules:
 * - Maximum 2 decimal places
 * - Cap at 10000 Prisms
 */

export function formatPrice(price: number): string {
  // Cap at 10000
  const cappedPrice = Math.min(price, 10000)
  
  // Format to max 2 decimal places, removing trailing zeros
  return cappedPrice.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function formatPriceWithCap(price: number): { formatted: string; isCapped: boolean } {
  const isCapped = price > 10000
  return {
    formatted: formatPrice(price),
    isCapped,
  }
}

export function getPriceDisplay(price: number): string {
  const { formatted, isCapped } = formatPriceWithCap(price)
  return isCapped ? `${formatted} (capped)` : formatted
}
