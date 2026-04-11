# Admin Filter Pattern Specification

## Feature: Admin List Page Filter Pattern
Standard filter layout and behavior applied to all admin dashboard list pages (contracts, inspections, maintenances, products, customers, users).

## Summary
Establishes a consistent filter UI pattern and Reset Filter button behavior across all admin list pages, ensuring predictable user experience.

## User Story
As an admin user, I want a consistent filter experience across all list pages, so that I can quickly find records using familiar controls without relearning different filter patterns on each page.

## Acceptance Criteria

### AC1: Standard Filter Layout
- [ ] Given any admin list page with filters
- When the page renders
- Then the filter section uses `flex flex-wrap items-end gap-4` layout
- And the filter section container uses `rounded-lg border border-stroke bg-white p-4`
- And all filter inputs and dropdowns align at the bottom (items-end ensures labels and inputs create consistent vertical alignment)
- And there is consistent 4-unit (1rem) spacing between all filter fields

### AC2: Standard Filter Field Styling
- [ ] Given any filter field (text input, dropdown, date input)
- When the filter field is rendered
- Then the label uses classes `mb-1 block text-xs font-medium text-gray-600`
- And the input/select uses classes `w-full rounded-lg border border-stroke bg-white px-4 py-2 outline-none focus:border-primary`
- And the label is displayed above the input with 0.25rem margin (mb-1)

### AC3: Reset Filter Button Presence
- [ ] Given any admin list page with filters
- When the page renders
- Then a "Reset Filter" button is present within the filter section
- And the button label is exactly "Reset Filter" (not "Reset", "Clear", or "Clear Filters")
- And the button uses classes `rounded-lg border border-stroke px-4 py-2 text-xs font-medium hover:bg-gray-100`
- And the button is positioned at items-end alignment (aligned with filter inputs)

### AC4: Reset Filter Button Behavior — Dropdown Filters
- [ ] Given an admin list page with dropdown filters (status, type, category, etc.)
- When the user clicks "Reset Filter"
- Then all dropdown filters are reset to their default empty value ("")
- And the dropdown UI displays the default "Semua..." option (e.g., "Semua Status", "Semua Jenis", "Semua Tipe")

### AC5: Reset Filter Button Behavior — Date Filters
- [ ] Given an admin list page with date input filters (date from, date to)
- When the user clicks "Reset Filter"
- Then all date input filters are cleared (value set to "")
- And the date input fields display no date (empty state)

### AC6: Reset Filter Button Behavior — Search Text Preservation
- [ ] Given an admin list page with a search text input and the user has entered search text
- When the user clicks "Reset Filter"
- Then the search text input value is NOT cleared (preserveSearch = true)
- And the search filter remains active and continues to filter the table

### AC7: Reset Filter Button Behavior — Table Update
- [ ] Given an admin list page with active filters
- When the user clicks "Reset Filter"
- Then the filtered table updates immediately to reflect the reset state
- And the table shows all records matching the search text filter (if present) but no other filters
- And if no search text is present, the table shows all records (no filters applied)

## Scope: In / Out

**In Scope:**
- Contracts page filter section and Reset Filter button
- Inspections page filter section and Reset Filter button
- Standard filter layout pattern (flex flex-wrap items-end gap-4)
- Standard Reset Filter button behavior (clear all filters except search text)
- Standard filter field styling (label, input, dropdown)

**Out of Scope:**
- Other admin list pages (maintenances, products, customers, users) — to be applied in future tasks
- Changes to existing filter logic (AND/OR combination, client-side vs server-side)
- Changes to existing search text behavior
- Changes to pagination behavior when filters are reset

## Edge Cases

### EC1: No Active Filters
- Given no filters are active (all dropdowns are empty, all date inputs are empty, search text is empty)
- When the user clicks "Reset Filter"
- Then nothing changes (already in reset state)
- And the table continues to display all records

### EC2: Only Search Text Active
- Given only search text is active (all other filters are empty)
- When the user clicks "Reset Filter"
- Then search text remains active
- And the table continues to display records matching the search text

### EC3: All Filters Active
- Given all filter fields have values (dropdowns selected, dates filled, search text entered)
- When the user clicks "Reset Filter"
- Then all dropdowns and date inputs are cleared
- And search text remains active
- And the table displays records matching only the search text filter

### EC4: Filter Reset on Empty Result Set
- Given filters are active and the table shows zero matching records
- When the user clicks "Reset Filter"
- Then filters are cleared (except search text)
- And the table updates to show all records matching the search text (or all records if search text is empty)

## Technical Constraints

### Frontend (Next.js / React)
- Filter state managed via useState hooks (one state variable per filter field)
- Reset Filter button onClick handler sets all filter state variables to their default values (except searchTerm)
- Filter section must use CSS flexbox (not grid) for consistent wrapping behavior
- Button hover effect must use Tailwind utility class (hover:bg-gray-100)

### Filter State Reset Values
| Filter Type | Default Reset Value |
|-------------|---------------------|
| Dropdown (status, type, category, etc.) | "" (empty string) |
| Date input (from, to) | "" (empty string) |
| Search text input | (no change — preserve current value) |

### Compatibility
- Pattern must work consistently across all admin list pages
- Pattern must be responsive (flex-wrap ensures wrapping on smaller screens)
- Pattern must not break existing pagination, sorting, or export functionality

## Open Questions
None — all behavioral details defined above. If a question arises during implementation, return to business-analyst for clarification.
