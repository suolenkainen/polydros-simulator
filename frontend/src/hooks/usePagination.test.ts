import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  describe('initialization', () => {
    it('initializes with default values', () => {
      const { result } = renderHook(() => usePagination(100))

      expect(result.current.currentPage).toBe(1)
      expect(result.current.pageSize).toBe(25)
      expect(result.current.totalPages).toBe(4)
    })

    it('initializes with custom page size', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 50 }))

      expect(result.current.pageSize).toBe(50)
      expect(result.current.totalPages).toBe(2)
    })

    it('initializes with custom starting page', () => {
      const { result } = renderHook(() => usePagination(100, { initialPage: 2 }))

      expect(result.current.currentPage).toBe(2)
    })

    it('handles zero items', () => {
      const { result } = renderHook(() => usePagination(0))

      expect(result.current.totalPages).toBe(1)
      expect(result.current.currentPage).toBe(1)
    })

    it('handles single page of items', () => {
      const { result } = renderHook(() => usePagination(10, { initialPageSize: 25 }))

      expect(result.current.totalPages).toBe(1)
      expect(result.current.currentPage).toBe(1)
    })
  })

  describe('pagination calculations', () => {
    it('calculates correct start and end indices', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25 }))

      expect(result.current.startIdx).toBe(0)
      expect(result.current.endIdx).toBe(25)
    })

    it('calculates correct indices for middle page', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25, initialPage: 3 }))

      expect(result.current.startIdx).toBe(50)
      expect(result.current.endIdx).toBe(75)
    })

    it('calculates correct indices for last page', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25, initialPage: 4 }))

      expect(result.current.startIdx).toBe(75)
      expect(result.current.endIdx).toBe(100)
    })

    it('handles incomplete last page', () => {
      const { result } = renderHook(() => usePagination(105, { initialPageSize: 25, initialPage: 5 }))

      expect(result.current.startIdx).toBe(100)
      expect(result.current.endIdx).toBe(125)
      expect(result.current.totalPages).toBe(5)
    })
  })

  describe('setCurrentPage', () => {
    it('updates current page', () => {
      const { result } = renderHook(() => usePagination(100))

      act(() => {
        result.current.setCurrentPage(2)
      })

      expect(result.current.currentPage).toBe(2)
    })

    it('clamps page to valid range (minimum)', () => {
      const { result } = renderHook(() => usePagination(100))

      act(() => {
        result.current.setCurrentPage(-5)
      })

      expect(result.current.currentPage).toBe(1)
    })

    it('clamps page to valid range (maximum)', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25 }))

      act(() => {
        result.current.setCurrentPage(100)
      })

      expect(result.current.currentPage).toBe(4) // Only 4 pages
    })

    it('clamps page to 1 when no items', () => {
      const { result } = renderHook(() => usePagination(0))

      act(() => {
        result.current.setCurrentPage(5)
      })

      expect(result.current.currentPage).toBe(1)
    })
  })

  describe('setPageSize', () => {
    it('updates page size', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25 }))

      act(() => {
        result.current.setPageSize(50)
      })

      expect(result.current.pageSize).toBe(50)
    })

    it('recalculates total pages when page size changes', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25 }))

      expect(result.current.totalPages).toBe(4)

      act(() => {
        result.current.setPageSize(50)
      })

      expect(result.current.totalPages).toBe(2)
    })

    it('resets to page 1 when page size changes', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25, initialPage: 3 }))

      act(() => {
        result.current.setPageSize(50)
      })

      expect(result.current.currentPage).toBe(1)
    })

    it('ignores invalid page sizes', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25 }))

      act(() => {
        result.current.setPageSize(0)
      })

      expect(result.current.pageSize).toBe(25) // Should not change
    })

    it('ignores negative page sizes', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25 }))

      act(() => {
        result.current.setPageSize(-10)
      })

      expect(result.current.pageSize).toBe(25) // Should not change
    })
  })

  describe('navigation methods', () => {
    it('previousPage moves to previous page', () => {
      const { result } = renderHook(() => usePagination(100, { initialPage: 3 }))

      act(() => {
        result.current.previousPage()
      })

      expect(result.current.currentPage).toBe(2)
    })

    it('previousPage clamps to page 1', () => {
      const { result } = renderHook(() => usePagination(100, { initialPage: 1 }))

      act(() => {
        result.current.previousPage()
      })

      expect(result.current.currentPage).toBe(1)
    })

    it('nextPage moves to next page', () => {
      const { result } = renderHook(() => usePagination(100, { initialPage: 2 }))

      act(() => {
        result.current.nextPage()
      })

      expect(result.current.currentPage).toBe(3)
    })

    it('nextPage clamps to last page', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25, initialPage: 4 }))

      act(() => {
        result.current.nextPage()
      })

      expect(result.current.currentPage).toBe(4)
    })

    it('firstPage goes to page 1', () => {
      const { result } = renderHook(() => usePagination(100, { initialPage: 3 }))

      act(() => {
        result.current.firstPage()
      })

      expect(result.current.currentPage).toBe(1)
    })

    it('lastPage goes to last page', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25 }))

      act(() => {
        result.current.lastPage()
      })

      expect(result.current.currentPage).toBe(4)
    })
  })

  describe('reset dependencies', () => {
    it('resets to initial page when dependencies change', () => {
      let dep = 'original'
      const { result, rerender } = renderHook(() => usePagination(100, { resetDependencies: [dep] }))

      act(() => {
        result.current.setCurrentPage(3)
      })
      expect(result.current.currentPage).toBe(3)

      dep = 'changed'
      rerender()

      expect(result.current.currentPage).toBe(1)
    })

    it('respects custom initial page on reset', () => {
      let dep = 'original'
      const { result, rerender } = renderHook(() =>
        usePagination(100, { initialPage: 2, resetDependencies: [dep] })
      )

      act(() => {
        result.current.setCurrentPage(3)
      })

      dep = 'changed'
      rerender()

      expect(result.current.currentPage).toBe(2)
    })
  })

  describe('edge cases', () => {
    it('handles large item counts', () => {
      const { result } = renderHook(() => usePagination(1000000, { initialPageSize: 100 }))

      expect(result.current.totalPages).toBe(10000)
    })

    it('handles very small page sizes', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 1 }))

      expect(result.current.totalPages).toBe(100)
    })

    it('maintains indices when item count is updated externally', () => {
      const { result, rerender } = renderHook(({ count }) => usePagination(count), {
        initialProps: { count: 100 },
      })

      expect(result.current.totalPages).toBe(4)

      rerender({ count: 50 })

      // Should clamp to valid page (page 1 in this case)
      expect(result.current.currentPage).toBe(1)
      expect(result.current.totalPages).toBe(2)
    })

    it('handles exact page boundary', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25 }))

      act(() => {
        result.current.setCurrentPage(4)
      })

      expect(result.current.startIdx).toBe(75)
      expect(result.current.endIdx).toBe(100)
      expect(result.current.totalPages).toBe(4)
    })
  })

  describe('integration scenarios', () => {
    it('supports full pagination workflow', () => {
      const { result } = renderHook(() => usePagination(100, { initialPageSize: 25 }))

      // Start at page 1
      expect(result.current.currentPage).toBe(1)

      // Navigate forward
      act(() => {
        result.current.nextPage()
      })
      expect(result.current.currentPage).toBe(2)

      // Change page size
      act(() => {
        result.current.setPageSize(50)
      })
      expect(result.current.currentPage).toBe(1)
      expect(result.current.totalPages).toBe(2)

      // Go to last page
      act(() => {
        result.current.lastPage()
      })
      expect(result.current.currentPage).toBe(2)

      // Navigate back
      act(() => {
        result.current.previousPage()
      })
      expect(result.current.currentPage).toBe(1)
    })

    it('handles rapid page changes', () => {
      const { result } = renderHook(() => usePagination(100))

      act(() => {
        result.current.nextPage()
        result.current.nextPage()
        result.current.previousPage()
        result.current.setCurrentPage(4)
        result.current.firstPage()
      })

      expect(result.current.currentPage).toBe(1)
    })
  })
  
})
