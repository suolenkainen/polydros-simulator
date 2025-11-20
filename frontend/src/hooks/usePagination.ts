import { useState, useEffect } from 'react'

interface UsePaginationOptions {
  /** Initial page size (default: 25) */
  initialPageSize?: number
  /** Initial page (default: 1) */
  initialPage?: number
  /** Reset to page 1 when these dependencies change */
  resetDependencies?: unknown[]
}

interface UsePaginationReturn {
  /** Current page number (1-indexed) */
  currentPage: number
  /** Number of items per page */
  pageSize: number
  /** Total number of pages */
  totalPages: number
  /** Start index for slicing data */
  startIdx: number
  /** End index for slicing data */
  endIdx: number
  /** Set the current page */
  setCurrentPage: (page: number) => void
  /** Set the page size */
  setPageSize: (size: number) => void
  /** Go to previous page */
  previousPage: () => void
  /** Go to next page */
  nextPage: () => void
  /** Go to first page */
  firstPage: () => void
  /** Go to last page */
  lastPage: () => void
}

/**
 * Reusable pagination hook for managing pagination state and logic.
 *
 * @param itemCount - Total number of items to paginate
 * @param options - Configuration options
 * @returns Pagination state and control methods
 *
 * @example
 * const pagination = usePagination(100, { initialPageSize: 25 })
 * const items = allItems.slice(pagination.startIdx, pagination.endIdx)
 */
export function usePagination(itemCount: number, options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPageSize = 25, initialPage = 1, resetDependencies = [] } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  // Calculate derived values
  const totalPages = Math.max(1, Math.ceil(itemCount / pageSize))
  const validPage = Math.max(1, Math.min(currentPage, totalPages))
  const startIdx = (validPage - 1) * pageSize
  const endIdx = startIdx + pageSize

  // Sync current page if it becomes invalid due to item count or page size changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // Reset to page 1 when dependencies change
  useEffect(() => {
    setCurrentPage(initialPage)
  }, resetDependencies)

  const handleSetCurrentPage = (page: number) => {
    const validatedPage = Math.max(1, Math.min(page, totalPages || 1))
    setCurrentPage(validatedPage)
  }

  const handleSetPageSize = (size: number) => {
    if (size > 0) {
      setPageSize(size)
      // Reset to page 1 when page size changes to avoid showing empty page
      setCurrentPage(1)
    }
  }

  const previousPage = () => {
    handleSetCurrentPage(validPage - 1)
  }

  const nextPage = () => {
    handleSetCurrentPage(validPage + 1)
  }

  const firstPage = () => {
    handleSetCurrentPage(1)
  }

  const lastPage = () => {
    handleSetCurrentPage(totalPages)
  }

  return {
    currentPage: validPage,
    pageSize,
    totalPages,
    startIdx,
    endIdx,
    setCurrentPage: handleSetCurrentPage,
    setPageSize: handleSetPageSize,
    previousPage,
    nextPage,
    firstPage,
    lastPage,
  }
}
