import { describe, it, expect } from 'vitest'
import { gemColorMap, getGemColorInfo, getContrastingTextColor, GemColorInfo } from '../gemColors'

describe('gemColors', () => {
  describe('gemColorMap', () => {
    it('should contain all expected gem colors', () => {
      expect(gemColorMap).toHaveProperty('Ruby')
      expect(gemColorMap).toHaveProperty('Sapphire')
      expect(gemColorMap).toHaveProperty('Emerald')
      expect(gemColorMap).toHaveProperty('Topaz')
      expect(gemColorMap).toHaveProperty('Amethyst')
      expect(gemColorMap).toHaveProperty('Diamond')
      expect(gemColorMap).toHaveProperty('Obsidian')
    })

    it('should have correct properties for Ruby', () => {
      const ruby = gemColorMap['Ruby']
      expect(ruby.name).toBe('Ruby')
      expect(ruby.hexColor).toBe('#DC143C')
      expect(ruby.icon).toBe('◆')
      expect(ruby.description).toBe('Ruby gem - Red mana')
    })

    it('should have correct properties for all colors', () => {
      Object.values(gemColorMap).forEach((colorInfo: GemColorInfo) => {
        expect(colorInfo.name).toBeDefined()
        expect(colorInfo.hexColor).toBeDefined()
        expect(colorInfo.icon).toBeDefined()
        expect(colorInfo.description).toBeDefined()
        expect(colorInfo.hexColor).toMatch(/^#[0-9A-F]{6}$/i)
      })
    })
  })

  describe('getGemColorInfo', () => {
    it('should return correct info for known colors', () => {
      const ruby = getGemColorInfo('Ruby')
      expect(ruby.name).toBe('Ruby')
      expect(ruby.hexColor).toBe('#DC143C')

      const sapphire = getGemColorInfo('Sapphire')
      expect(sapphire.name).toBe('Sapphire')
      expect(sapphire.hexColor).toBe('#0047AB')
    })

    it('should return fallback for unknown colors', () => {
      const unknown = getGemColorInfo('UnknownColor')
      expect(unknown.name).toBe('UnknownColor')
      expect(unknown.hexColor).toBe('#999999')
      expect(unknown.icon).toBe('◆')
    })

    it('should handle all standard gem colors', () => {
      const colors = ['Ruby', 'Sapphire', 'Emerald', 'Topaz', 'Amethyst', 'Diamond', 'Obsidian']
      colors.forEach((color) => {
        const info = getGemColorInfo(color)
        expect(info.hexColor).not.toBe('#999999') // Should not be fallback
      })
    })
  })

  describe('getContrastingTextColor', () => {
    it('should return white text for dark backgrounds', () => {
      expect(getContrastingTextColor('#000000')).toBe('#FFFFFF')
      expect(getContrastingTextColor('#333333')).toBe('#FFFFFF')
      expect(getContrastingTextColor('#1A1A1A')).toBe('#FFFFFF')
    })

    it('should return black text for light backgrounds', () => {
      expect(getContrastingTextColor('#FFFFFF')).toBe('#000000')
      expect(getContrastingTextColor('#EEEEEE')).toBe('#000000')
      expect(getContrastingTextColor('#CCCCCC')).toBe('#000000')
    })

    it('should work with all gem colors', () => {
      Object.values(gemColorMap).forEach((colorInfo: GemColorInfo) => {
        const textColor = getContrastingTextColor(colorInfo.hexColor)
        expect(['#FFFFFF', '#000000']).toContain(textColor)
      })
    })

    it('should handle case-insensitive hex colors', () => {
      const uppercase = getContrastingTextColor('#FFFFFF')
      const lowercase = getContrastingTextColor('#ffffff')
      expect(uppercase).toBe(lowercase)
    })
  })
})
