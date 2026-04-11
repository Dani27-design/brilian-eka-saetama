# ADR-003: Collapsible Filter Pattern for Admin Dashboard

## Status
Accepted

## Date
2026-04-10

## Context
The admin dashboard has 7 list pages that require filtering:
- Products (ProductFilters.tsx)
- Customers (CustomerFilters.tsx)
- Maintenances (MaintenanceFilters.tsx)
- Users (inline in page.tsx)
- Blogs (inline in page.tsx)
- Contracts (inline in page.tsx)
- Inspections (inline in page.tsx)

The first three pages already use a collapsible filter pattern with dedicated filter components. The remaining four pages have inline always-visible filters embedded directly in the page files. This inconsistency creates:
- Inconsistent UX across admin pages
- Bloated page files (users/page.tsx at 919 LOC, inspections/page.tsx at 918 LOC)
- Duplicated filter UI patterns
- Difficulty maintaining visual consistency

## Decision
All admin list pages must use the collapsible filter pattern with dedicated filter components. The pattern is defined as follows:

### Structure
Each filter section must be a standalone React component located at:
```
website/components/Admin/{Feature}/{Feature}Filters.tsx
```

### Required Elements
1. **Always-visible row** containing:
   - Search input (left-aligned, max-width constrained)
   - Results count showing "X dari Y {entity}" (right side)
   - "Filter Lanjutan" toggle button with chevron icon (right side)
   - "Clear Filters" link (visible only when non-default filters are active)

2. **Collapsible section** (hidden by default) containing:
   - Domain-specific filter dropdowns in a responsive grid
   - Sort controls (sortBy + sortOrder dropdowns)
   - Background: `bg-gray-50` with `border border-stroke rounded-lg`

### Props Interface
Every filter component must accept:
```typescript
interface {Feature}FiltersProps {
  filters: {Feature}Filters;
  onFiltersChange: (filters: {Feature}Filters) => void;
  onClearFilters: () => void;
  {entity}Count: number;
  filteredCount: number;
}
```

### Behavior Requirements
1. **preserveSearch pattern**: `onClearFilters` resets all filter dropdowns to defaults but preserves the search text
2. **Active filter indicator**: Orange dot on toggle button when any non-default filter is active (use `bg-orange-400` class)
3. **Chevron rotation**: 180-degree rotation when expanded
4. **Responsive grid**: 1 column mobile, 2 columns tablet, 4 columns desktop for filter dropdowns

### Reference Implementation
`website/components/Admin/Customers/CustomerFilters.tsx` (229 LOC) serves as the canonical template due to its clean structure without page-specific features.

**Note:** The template currently uses `bg-primary` for the indicator dot. New implementations must use `bg-orange-400` for the orange dot indicator per this ADR. Existing implementations (ProductFilters, CustomerFilters, MaintenanceFilters) should be updated to use `bg-orange-400` for consistency.

### File Locations (per stakeholder direction)
New filter components go in feature subdirectories:
- `website/components/Admin/Users/UserFilters.tsx`
- `website/components/Admin/Blogs/BlogFilters.tsx`
- `website/components/Admin/Contracts/ContractFilters.tsx`
- `website/components/Admin/Inspections/InspectionFilters.tsx`

Co-located test files:
- `website/components/Admin/Users/UserFilters.test.tsx`
- `website/components/Admin/Blogs/BlogFilters.test.tsx`
- `website/components/Admin/Contracts/ContractFilters.test.tsx`
- `website/components/Admin/Inspections/InspectionFilters.test.tsx`

## Rationale
- **Consistency**: Users learn one filter interaction pattern across all admin pages
- **Maintainability**: Filter logic isolated in dedicated components makes changes localized
- **SRP compliance**: Page files handle routing and data fetching; filter components handle filter UI
- **LOC reduction**: Extracting filters reduces page file bloat (users/page.tsx from 919 LOC to ~800 LOC)
- **Testability**: Isolated filter components can be unit tested independently

## Consequences

### Positive
- Unified UX across all 7 admin list pages
- Cleaner page files with clear separation of concerns
- Easier to add/modify filters without touching page files
- Co-located tests enable independent verification of filter behavior

### Negative
- Initial effort to extract and migrate 4 inline filter sections
- Minor bundle size increase (4 new component files)
- Existing pages (Products, Customers, Maintenances) already work — low risk of regression

### Neutral
- No database or API changes required
- Mobile app not affected (admin dashboard is web-only)

## Compliance
This ADR is binding for all current and future admin list pages. New admin list features must use this pattern from the start.

## Related
- ADR-001: Firebase as Sole Backend
- ADR-002: Monorepo Structure
