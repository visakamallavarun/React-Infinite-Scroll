# React Infinite Scroll Table with Generic Filters

This project demonstrates a production-style infinite scrolling data table built with React, TypeScript, Ant Design, and React Query.

The implementation is centered around three reusable pieces:

1. `InfiniteScrollTable` component
2. `useGenericInfiniteQuery` hook
3. `GenericFilterBar` component

These are intentionally decoupled so you can reuse the same table and hook pattern with different datasets and filter schemas.

## Tech Stack

- React 18 + TypeScript
- Vite
- Ant Design (`Table`, `Card`, `Select`, `Input`, `DatePicker`, etc.)
- TanStack React Query (`useInfiniteQuery`)

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Project Structure

```text
src/
  components/
    InfiniteScrollTable.tsx
    GenericFilterBarProps.tsx
    FilterButton.tsx
    LookupSelected.tsx
  hooks/
    useGenericInfiniteQuery.ts
    useDynamicTableHeight.ts
  services/
    mockData.ts
  App.tsx
```

## Core Feature 1: InfiniteScrollTable Component

File: `src/components/InfiniteScrollTable.tsx`

`InfiniteScrollTable<TItem>` is a generic table wrapper that combines virtualized rendering with bidirectional infinite pagination.

### Responsibilities

- Renders large datasets efficiently using Ant Design virtual table mode.
- Flattens paginated React Query data (`data.pages[].items`) into one `dataSource`.
- Detects near-bottom and near-top scrolling to trigger:
  - `fetchNextPage()`
  - `fetchPreviousPage()`
- Preserves user scroll continuity when `maxPages` causes page window replacement.
- Resets vertical scroll position when filter parameters change.
- Computes horizontal scroll width from column definitions when `scrollX` is not provided.

### Highlighted Behaviors

1. Generic typing
   - Works with any row shape via `<TItem extends object>`.
2. Bidirectional loading
   - Loads next page at bottom threshold (`< 50px` remaining).
   - Loads previous page at top threshold (`scrollTop < 50`).
3. Scroll restoration logic
   - Handles the tricky case where React Query keeps only a fixed page window (`DEFAULT_MAX_PAGES`).
   - Repositions `scrollTop` to avoid jumpy UX when old pages are dropped.
4. Filter-aware reset
   - Accepts `filterParams` string.
   - Resets scroll to top when filters are changed/applied.
5. Adaptive dimensions
   - Uses `useDynamicTableHeight` to keep table height responsive to viewport size.

### Props Summary

- Data/query state:
  - `data`, `loading`
  - `isFetchingNextPage`, `hasNextPage`, `fetchNextPage`
  - `isFetchingPreviousPage`, `hasPreviousPage`, `fetchPreviousPage`
- Table config:
  - `columns`, `rowKey`, `scrollX`, `minHeight`
- Filter synchronization:
  - `filterParams`

## Core Feature 2: useGenericInfiniteQuery Hook

File: `src/hooks/useGenericInfiniteQuery.ts`

`useGenericInfiniteQuery<TData>` is a reusable abstraction around `useInfiniteQuery` that standardizes page-based API usage.

### Responsibilities

- Accepts a generic `fetchFn(pageParam, signal)` with abort support.
- Configures infinite query pagination rules (`getNextPageParam`, `getPreviousPageParam`).
- Applies `maxPages` limit using `DEFAULT_MAX_PAGES` to cap memory and cache growth.
- Supports optional `enabled` flag for conditional execution.
- Detects and corrects stale cached page windows for changed query keys.

### Highlighted Behaviors

1. Query-key driven cache partitioning
   - `queryKey` includes filters, so each filter set has isolated cache state.
2. Automatic page navigation logic
   - Uses API metadata (`hasNextPage`, `hasPreviousPage`, `page`) to compute page params.
3. Cache window guard
   - If cached data for a key starts from a non-first page, the hook clears and refetches.
   - Prevents entering a query with an offset page window as the initial view.
4. AbortSignal support
   - Integrates cancellation into API layer through `signal` propagation.

### Hook Contract

Input:

- `queryKey: unknown[]`
- `fetchFn: (pageParam, signal) => Promise<PaginatedResponse<TData>>`
- `enabled?: boolean`

Output:

- Full React Query infinite query object (`data`, loading states, fetch methods, `refetch`, etc.)

## Core Feature 3: GenericFilterBar Component

File: `src/components/GenericFilterBarProps.tsx`

`GenericFilterBar<T>` is a schema-driven dynamic filter UI that can render multiple filter types from a typed configuration object.

### Supported Filter Types

- Text (`FilterType.Text`)
- Single Select (`FilterType.Select`)
- Multi Select (`FilterType.MultiSelect`)
- Date Range (`FilterType.DateRange`)

### Responsibilities

- Builds UI controls from `config` instead of hardcoding fields.
- Maintains controlled values via `filterValues` + `setFilterValues`.
- Converts UI-friendly values into API-ready values on Apply.
- Exposes action callbacks:
  - `onApply` via `getFilterValues`
  - `onRefresh`
  - `onReset`
- Supports optional `customElements` area for right-side actions/widgets.

### Highlighted Behaviors

1. Strong typing
   - Filter names are constrained to keys of `T`.
2. Multi-select normalization
   - Applies `All`/`0` selection rules to avoid contradictory states.
3. API payload sanitization
   - On apply, converts:
     - arrays to comma-separated strings
     - `All`/`0` sentinel values to empty string
4. Responsive layout
   - Uses per-filter col spans with defaults by filter type.
5. Date range mapping
   - Maps selected range into start/end keys using `MM-DD-YYYY` format.

## Supporting Components

### FilterActions

File: `src/components/FilterButton.tsx`

- Icon-based action cluster for Apply, Refresh, and Reset.
- Clean separation keeps filter bar rendering logic focused.

### LookupSelect

File: `src/components/LookupSelected.tsx`

- Reusable select component for both:
  - primitive string options
  - `{ id, description }` lookup options
- Supports both single and multi mode through discriminated union props.
- Adds search and checkbox rendering for multi-select UX.

### useDynamicTableHeight

File: `src/hooks/useDynamicTableHeight.ts`

- Calculates `window.innerHeight - offset`.
- Updates on resize for consistent table viewport behavior.

## Data Layer (Mock)

File: `src/services/mockData.ts`

- Generates 1000 users.
- Applies filters on name, email, department, status.
- Returns `PaginatedResponse<T>` shape expected by table and query hook.
- Simulates network delay and handles cancellation.

## Integration Flow in App

File: `src/App.tsx`

1. Define filter configuration and default values.
2. Keep two filter states:
   - `filterValues` (editing state)
   - `appliedFilters` (query state)
3. Pass `appliedFilters` into `queryKey` for stable cache scoping.
4. Render `GenericFilterBar` to apply/reset/refresh filters.
5. Render `InfiniteScrollTable` with query state and pagination handlers.
6. Pass `filterParams={JSON.stringify(appliedFilters)}` to sync filter changes with scroll reset behavior.

## Why This Pattern Works

- Reusable: table, hook, and filter bar can be reused independently.
- Performant: virtual rendering + bounded page cache.
- Predictable: query key controls cache and refetch behavior.
- User-friendly: smooth scroll transitions and easy filter actions.

## Future Enhancements

- Server-side sorting integration in `InfiniteScrollTable`.
- URL-synced filter state for sharable views.
- Debounced text inputs for lower API pressure.
- Unit tests for `applySelectionRules` and query cache reset branch.
