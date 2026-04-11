# Admin Collapsible Filter Pattern Specification

## Feature: Collapsible Filter Pattern for Admin List Pages
Standard collapsible filter component pattern applied to all 7 admin dashboard list pages.

## Summary
All admin list pages must use a dedicated collapsible filter component that follows a consistent pattern: always-visible search row with "Filter Lanjutan" toggle button, and a collapsible section containing domain-specific filter dropdowns. This spec supersedes the inline filter approach and establishes the canonical pattern for filter UI.

## User Story
As an admin user, I want filter controls to be hidden by default with a "Filter Lanjutan" toggle, so that the page is less cluttered while still allowing me to access advanced filters when needed.

## Reference ADR
`website/docs/architecture/2026-04-10-collapsible-filter-pattern.md`

## Component Structure

### File Location Pattern
Each filter component must be a standalone React component at:
```
website/components/Admin/{Feature}/{Feature}Filters.tsx
website/components/Admin/{Feature}/{Feature}Filters.test.tsx
```

### Required Pages (7 total)
| Page | Filter Component | Status |
|------|-----------------|--------|
| Products | ProductFilters.tsx | Exists (update indicator dot) |
| Customers | CustomerFilters.tsx | Exists (update indicator dot) |
| Maintenances | MaintenanceFilters.tsx | Exists (update indicator dot) |
| Users | UserFilters.tsx | To be created |
| Blogs | BlogFilters.tsx | To be created |
| Contracts | ContractFilters.tsx | To be created |
| Inspections | InspectionFilters.tsx | To be created |

## Acceptance Criteria

### AC1: Always-Visible Row Structure
- [ ] Given any admin list page with filters
- When the page renders
- Then the filter component displays an always-visible row containing:
  - Search input (left-aligned, max-width constrained via `max-w-md`)
  - Results count showing "X dari Y {entity}" (right side)
  - "Filter Lanjutan" toggle button with chevron icon (right side)
  - "Clear Filters" link (visible only when non-default filters are active)

### AC2: Collapsible Section Structure
- [ ] Given the filter component
- When the "Filter Lanjutan" button is clicked
- Then a collapsible section expands below the always-visible row
- And the collapsible section has background `bg-gray-50`
- And the collapsible section has border `border border-stroke rounded-lg`
- And the collapsible section has padding `p-4`
- And the collapsible section contains domain-specific filter dropdowns in a responsive grid

### AC3: Toggle Button Behavior
- [ ] Given the "Filter Lanjutan" button
- When the collapsible section is collapsed (default state)
- Then the chevron icon points downward (no rotation)
- When the button is clicked
- Then the collapsible section expands
- And the chevron icon rotates 180 degrees (via `rotate-180` class)

### AC4: Active Filter Indicator (Orange Dot)
- [ ] Given any non-default filter is active (excluding search text)
- When the page renders
- Then an orange dot indicator appears next to "Filter Lanjutan" text
- And the dot uses classes `flex h-2 w-2 rounded-full bg-orange-400`
- And the dot is visible whether the collapsible section is expanded or collapsed

### AC5: Clear Filters / Reset Behavior (preserveSearch)
- [ ] Given the "Clear Filters" or "Reset" button
- When clicked
- Then all filter dropdowns reset to their default values
- And date inputs reset to empty
- And search text input is NOT cleared (preserved)
- And the table updates immediately to reflect the reset state

### AC6: Responsive Grid for Filter Dropdowns
- [ ] Given the collapsible section with filter dropdowns
- When rendered on mobile (< 768px)
- Then filters display in 1 column
- When rendered on tablet (768px - 1024px)
- Then filters display in 2 columns
- When rendered on desktop (> 1024px)
- Then filters display in 4 columns
- And the grid uses classes `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4`

### AC7: Props Interface
- [ ] Given any filter component
- Then it accepts the following props:
  - `filters: {Feature}Filters` — current filter state object
  - `onFiltersChange: (filters) => void` — callback when any filter changes
  - `onClearFilters: () => void` — callback when clear/reset is clicked
  - `{entity}Count: number` — total count of entities
  - `filteredCount: number` — count after filters applied

### AC8: Sort Controls
- [ ] Given the collapsible section
- Then it contains sort controls (sortBy and sortOrder dropdowns)
- And sort controls are in a separate row below the filter dropdowns
- And sort controls use `grid grid-cols-1 gap-4 md:grid-cols-2` layout

## Page-Specific Filter Fields

### Users Page
- Role filter: admin / engineer / user
- Status filter: active / inactive
- Date range: createdAt from/to

### Blogs Page
- Author filter: dynamic from data
- Date range: publishDate from/to

### Contracts Page
- Status filter: active / inactive / terminated
- Contract type filter: service / maintenance / rental / sales / other
- Customer filter: dynamic from data

### Inspections Page
- Product type filter: APAR / HYDRANT / CCTV / FIRE_ALARM / ACCESS_DOOR / PATROL_GUARD
- Status filter: pending / scheduled / waiting_approval / approved / rejected
- Date range: inspectionDate from/to
- **Special default:** filterProductType defaults to "APAR", Reset restores to "APAR" (not empty)

## Edge Cases

### EC1: No Active Filters
- Given no non-default filters are active
- When page renders
- Then orange dot indicator is NOT visible
- And "Clear Filters" link is NOT visible

### EC2: Only Search Text Active
- Given only search text has a value, all other filters are default
- When page renders
- Then orange dot indicator is NOT visible (search text does not count)
- And "Clear Filters" link is NOT visible

### EC3: Inspections Default Filter
- Given the inspections page loads
- When filterProductType is "APAR" (the default)
- Then orange dot indicator is NOT visible
- When filterProductType is changed to any other value (or empty)
- Then orange dot indicator IS visible

## Scope: In / Out

**In Scope:**
- Creating 4 new filter components (Users, Blogs, Contracts, Inspections)
- Updating 3 existing filter components to use `bg-orange-400` indicator dot
- Removing inline filter code from page files
- Importing and using filter components in page files
- Co-located test files for all new filter components

**Out of Scope:**
- Changes to filter logic (AND/OR, client vs server-side)
- Changes to pagination behavior
- Changes to data fetching
- Changes to sort logic
- Mobile app filters

## Technical Constraints

### CSS Classes (Exact Match Required)
| Element | Classes |
|---------|---------|
| Collapsible section wrapper | `rounded-lg border border-stroke bg-gray-50 p-4` |
| Active filter indicator dot | `flex h-2 w-2 rounded-full bg-orange-400` |
| Toggle button | `flex items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50` |
| Chevron rotation | `transition-transform` and `rotate-180` when expanded |
| Filter dropdown grid | `grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4` |

### Test Requirements (Static File Analysis Pattern)
Tests use `readFileSync` + regex in Node.js environment (not jsdom).
Each test must verify:
1. Component file exists at correct path
2. Contains "Filter Lanjutan" text/button
3. Contains chevron SVG icon path (`M19 9l-7 7-7-7`)
4. Contains orange dot indicator class (`bg-orange-400`)
5. Contains collapsible section classes (`rounded-lg border border-stroke bg-gray-50 p-4`)
6. Contains Reset/Clear Filters button
7. Page file imports the filter component
8. Page file no longer contains inline filter state

## Open Questions
None. All behavioral details defined in this spec and the referenced ADR.
