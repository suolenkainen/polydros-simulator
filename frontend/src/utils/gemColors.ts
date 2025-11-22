/**
 * Utility for mapping card colors to gem colors and icons.
 * Supports the Polydros TCG color system.
 */

export interface GemColorInfo {
  name: string
  hexColor: string
  icon: string
  description: string
}

export const gemColorMap: Record<string, GemColorInfo> = {
  Ruby: {
    name: 'Ruby',
    hexColor: '#DC143C', // Crimson red
    icon: '◆',
    description: 'Ruby gem - Red mana',
  },
  Sapphire: {
    name: 'Sapphire',
    hexColor: '#0047AB', // Cobalt blue
    icon: '◆',
    description: 'Sapphire gem - Blue mana',
  },
  Emerald: {
    name: 'Emerald',
    hexColor: '#50C878', // Emerald green
    icon: '◆',
    description: 'Emerald gem - Green mana',
  },
  Topaz: {
    name: 'Topaz',
    hexColor: '#FFD700', // Gold/yellow
    icon: '◆',
    description: 'Topaz gem - Yellow mana',
  },
  Amethyst: {
    name: 'Amethyst',
    hexColor: '#9966CC', // Purple
    icon: '◆',
    description: 'Amethyst gem - Purple mana',
  },
  Diamond: {
    name: 'Diamond',
    hexColor: '#E8E8E8', // White/silver
    icon: '◇',
    description: 'Diamond gem - Colorless mana',
  },
  Obsidian: {
    name: 'Obsidian',
    hexColor: '#1A1A1A', // Black
    icon: '◆',
    description: 'Obsidian gem - Black mana',
  },
}

/**
 * Get color info for a gem/card color
 */
export function getGemColorInfo(color: string): GemColorInfo {
  return (
    gemColorMap[color] || {
      name: color,
      hexColor: '#999999',
      icon: '◆',
      description: `${color} gem`,
    }
  )
}

/**
 * Get contrasting text color for a background color
 */
export function getContrastingTextColor(hexColor: string): string {
  // Simple luminance calculation
  const rgb = parseInt(hexColor.slice(1), 16)
  const r = (rgb >> 16) & 255
  const g = (rgb >> 8) & 255
  const b = rgb & 255
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
