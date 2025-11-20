# Frontend Refactoring Analysis & Test Coverage Report

## Executive Summary

**Frontend Files Analyzed**: 7 components + 1 utility  
**E2E Tests Found**: 5 test files  
**Coverage Assessment**: Limited - E2E only, no unit tests for components  
**Refactoring Opportunities**: High - multiple components have duplication and can be optimized

---

## File-by-File Analysis

### 1. **CardDetail.tsx** (156 lines)
**Status**: ⚠️ Moderate refactoring needed

**Issues**:
- Rarity color mapping is hardcoded in component (should be constant/config)
- Gem cost generation logic (lines 51-62) could be extracted
- SVG price graph is hardcoded/placeholder (lines 208-237)
- Unused `useEffect` import

**Refactoring Opportunities**:
- Extract `rarityColors` to a constants file
- Create `useGemCost()` hook for gem text generation
- Create `RarityBadge` sub-component
- Create `CardStats` sub-component
- Create `CardImage` sub-component (handles alternate art logic)
- Move SVG chart to separate component

**Current Test Coverage**: ❌ Zero (no unit tests)
**Recommended Tests**:
- Snapshot test for card rendering
- Test gem cost generation
- Test rarity color mapping
- Test alternate art image positioning
- Test price formatting integration

---

### 2. **EventsView.tsx** (141 lines)
**Status**: ⚠️ Moderate refactoring needed

**Issues**:
- Pagination logic duplicated (similar to AgentDetail)
- Event filtering logic (type + search) could be extracted
- `formatEventType()` function should be in utils
- Triggered state class logic (lines 94-99) could be extracted
- Repeated event rendering logic

**Refactoring Opportunities**:
- Extract `usePagination()` hook
- Extract `useEventFilter()` hook
- Move `formatEventType()` to utils
- Create `EventItem` sub-component
- Create `PaginationControls` sub-component (reusable)
- Create `usEventStatus()` hook for triggered state mapping

**Current Test Coverage**: ✅ Partial (E2E tests verify rendering)
**Recommended Tests**:
- Filter functionality (type and search)
- Pagination state changes
- Triggered state class assignment
- Event formatting
- Edge cases (empty events, single page)

---

### 3. **SimulationRunner.tsx** (137 lines)
**Status**: ⚠️ High refactoring needed

**Issues**:
- Initialization logic duplicated in `React.useEffect` and `onReset()` (lines 30-54, 92-116)
- Two separate API calls patterns (initialization vs run)
- Event collection logic is verbose (lines 84-89)
- Type definitions for TimeseriesPoint/WorldSummary could be in types file
- Unused Chart.js import (commented code still referenced)

**Refactoring Opportunities**:
- Extract `useSimulation()` hook with initialization + reset
- Extract `useSimulationState()` hook
- Create `SimulationForm` sub-component
- Extract types to types file
- Create utility function `extractEventsFroSeries()`
- Simplify the double-callback pattern (onWorldSummary, onEvents)

**Current Test Coverage**: ✅ E2E tests verify basic execution
**Recommended Tests**:
- Initialization on mount
- Reset functionality
- Validation (negative ticks, zero ticks)
- Event collection logic
- API error handling
- Data structure consistency

---

### 4. **AgentDetail.tsx** (258 lines)
**Status**: ⚠️ High refactoring needed (longest component)

**Issues**:
- Pagination state duplicated from EventsView (lines 43-44)
- Pagination logic repeated (lines 182-210)
- Inline trait descriptions (lines 98-112) should be constants
- Section toggle logic could be extracted
- Multiple levels of nesting and inline styles
- Event rendering similar to EventsView

**Refactoring Opportunities**:
- Extract `usePagination()` hook
- Extract `useSectionToggle()` hook
- Create `TraitScores` sub-component
- Create `AgentEvents` sub-component with pagination
- Create `AgentDeck` sub-component
- Move trait descriptions to constants
- Extract `AgentTraits` sub-component

**Current Test Coverage**: ❌ Zero (no unit tests)
**Recommended Tests**:
- Component renders with agent data
- Section toggle functionality
- Event pagination
- Deck display
- Trait formatting
- Loading and error states

---

### 5. **AgentList.tsx** (45 lines)
**Status**: ✅ Good (minimal refactoring)

**Issues**:
- None major - component is focused and simple
- Could extract agent button to sub-component for reusability

**Refactoring Opportunities**:
- Create `AgentListItem` sub-component if agent display logic grows

**Current Test Coverage**: ✅ E2E tests verify polling and numbering
**Recommended Tests**:
- Polling interval (verify 2s interval)
- Agent list updates
- Click handler
- Loading state
- Empty agents list

---

### 6. **AgentInventory.tsx** (not shown but referenced)
**Status**: ⚠️ Unknown

**Action**: Review for similar patterns

---

### 7. **WorldView.tsx** (not shown but referenced)
**Status**: ⚠️ Unknown

**Action**: Review for similar patterns

---

### 8. **priceFormatter.ts** (26 lines)
**Status**: ✅ Good

**Issues**: None

**Current Test Coverage**: ❌ Zero (no unit tests)
**Recommended Tests**:
- Format price with decimals
- Price capping at 10000
- Trailing zero removal
- Display string with cap notation

---

## Test Coverage Summary

### Existing E2E Tests
- `e2e.spec.ts` - Basic simulation execution
- `e2e-ui-updates.spec.ts` - Agent numbering, real-time updates
- `e2e-tick.spec.ts` - Tick advancement
- `e2e-combat.spec.ts` - Combat events
- `e2e-card-images.spec.ts` - Card image loading

### Missing Unit/Integration Tests
❌ **CardDetail** - 0% coverage
❌ **EventsView** - 0% component unit tests (some E2E)
❌ **SimulationRunner** - Limited E2E only
❌ **AgentDetail** - 0% coverage
✅ **AgentList** - Good E2E coverage
❌ **priceFormatter** - 0% coverage

---

## Refactoring Priority Matrix

### Priority 1 (Critical)
1. **Extract Pagination Hook** - Used in EventsView + AgentDetail
   - Reduces duplication by ~40 lines
   - Improves maintainability
   
2. **Extract useSimulation Hook** - Eliminates SimulationRunner duplication
   - Consolidates initialization/reset logic
   - Makes testable

3. **Create PaginationControls Component** - Reusable UI
   - Deduplication across views

### Priority 2 (Important)
1. **Extract formatEventType to utils** - Used in multiple places
2. **Create EventItem component** - Simplifies EventsView
3. **Create sub-components for CardDetail** - Breaks up large component
4. **Move types to types file** - Better organization

### Priority 3 (Nice-to-have)
1. **Create Trait description constants**
2. **Extract event filtering logic**
3. **Optimize AgentDetail rendering**

---

## Recommended Implementation Order

1. **Week 1**: Extract hooks (pagination, simulation, event filter)
2. **Week 2**: Create shared components (PaginationControls, EventItem)
3. **Week 3**: Add unit tests for refactored code
4. **Week 4**: Refactor remaining components

---

## Test Implementation Roadmap

### Phase 1: Utility Tests (Quick wins)
- `priceFormatter.test.ts` - 5 tests
- `eventTypeFormatter.test.ts` - 5 tests

### Phase 2: Hook Tests
- `usePagination.test.ts` - 8 tests
- `useSimulation.test.ts` - 10 tests
- `useSectionToggle.test.ts` - 5 tests

### Phase 3: Component Tests
- `CardDetail.test.tsx` - 12 tests
- `EventItem.test.tsx` - 8 tests
- `AgentDetail.test.tsx` - 15 tests

### Phase 4: Integration Tests
- `EventsView.integration.test.tsx` - 10 tests
- `SimulationRunner.integration.test.tsx` - 8 tests

**Total Estimated New Tests**: ~76 unit + integration tests

---

## Code Metrics

| Component | Lines | Methods | Complexity | Reusable Logic |
|-----------|-------|---------|------------|----------------|
| CardDetail | 156 | 1 | Medium | Yes (gem cost, colors) |
| EventsView | 141 | 2 | Medium | Yes (pagination, filter) |
| SimulationRunner | 137 | 3 | High | Yes (initialization) |
| AgentDetail | 258 | 3 | High | Yes (pagination, toggle) |
| AgentList | 45 | 1 | Low | No |
| priceFormatter | 26 | 3 | Low | No |

---

## Next Steps

1. **Choose starter refactoring**: Extract `usePagination()` hook
2. **Create hook with tests**: Drive test-first development
3. **Refactor EventsView** to use hook
4. **Refactor AgentDetail** to use hook
5. **Continue with Phase 2**

---

## Notes

- All E2E tests are integration-level; missing unit tests for individual functions
- Heavy reuse of pagination and state management patterns suggests hook extraction is highest ROI
- CardDetail has multiple rendering concerns that benefit from sub-components
- Recommend using Vitest for unit tests (built into Vite setup)
- Consider React Testing Library for component tests
