# Feature: Edit and Delete Button Standardization

## Summary
Standardize the appearance and implementation of Edit and Delete buttons across all admin pages. Currently, Edit buttons use 4 different color schemes across 7 locations, and Delete buttons use 3 different patterns across 5 locations. This inconsistency creates user confusion and an unprofessional appearance.

## User Story
As an admin user navigating the dashboard, I want Edit and Delete buttons to look and behave consistently across all pages, so that I can quickly identify action buttons without confusion and perceive the system as professionally designed.

## Acceptance Criteria

### Edit Button Standardization

- [ ] Given the users page at `/admin/users`, when viewing the table, then the Edit button uses `<Link>` element with className `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` and contains a pencil SVG icon
- [ ] Given the products page at `/admin/products`, when viewing the table, then the Edit button uses `<Link>` element with className `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` and contains a pencil SVG icon
- [ ] Given the customers page at `/admin/customers`, when viewing the CustomerListItem component, then the Edit button uses `<Link>` element with className `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` and contains a pencil SVG icon
- [ ] Given the contracts page at `/admin/contracts`, when viewing the table, then the Edit button uses `<Link>` element with className `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` and contains a pencil SVG icon
- [ ] Given the maintenances page at `/admin/maintenances`, when viewing the table, then the Edit button uses `<Link>` element (not `<a>`) with className `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` and contains a pencil SVG icon
- [ ] Given the blogs page at `/admin/blogs`, when viewing the table, then the Edit button uses `<Link>` element with className `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` and contains a pencil SVG icon
- [ ] Given the InspectionsTable component, when viewing any inspection row, then the Edit button uses `<Link>` element with className `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` and contains a pencil SVG icon
- [ ] Given any Edit button across all admin pages, when inspecting the button element, then it does not contain any fixed width classes (w-14, w-16, w-18) and uses only px-3 py-1.5 for padding
- [ ] Given any Edit button across all admin pages, when inspecting the button element, then it always uses `<Link>` from `next/link` and never `<button>` or `<a>` element

### Delete Button Standardization

- [ ] Given the users page at `/admin/users`, when viewing the table, then the Delete button uses `<button>` element with className `inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50` and contains a trash SVG icon
- [ ] Given the contracts page at `/admin/contracts`, when viewing the table, then the Delete button uses `<button>` element with className `inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50` and contains a trash SVG icon
- [ ] Given the blogs page at `/admin/blogs`, when viewing the table, then the Delete button uses `<button>` element with className `inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50` and contains a trash SVG icon
- [ ] Given the customers page at `/admin/customers`, when viewing the CustomerListItem component, then the Delete button uses `<button>` element with className `inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50` and contains a trash SVG icon
- [ ] Given any Delete button across all admin pages (excluding products dropdown), when inspecting the button element, then it does not contain any fixed width classes (w-18) and uses only px-3 py-1.5 for padding
- [ ] Given any Delete button across all admin pages (excluding products dropdown), when inspecting the button element, then it uses outline style with border-red-300, bg-white, and text-red-600 (not filled style with bg-red-100)

### Visual Consistency

- [ ] Given any admin page with both Edit and Delete buttons, when viewing the table, then both buttons have the same vertical padding (py-1.5) and horizontal padding (px-3), making them visually aligned in height
- [ ] Given any admin page with both Edit and Delete buttons, when viewing the table, then both buttons use the same border-radius (rounded-lg) and font size (text-xs font-medium)
- [ ] Given any admin page with both Edit and Delete buttons, when viewing the table, then both buttons use the `inline-flex items-center gap-1` pattern with icons consistently positioned before text labels (if present)

### Static Source Analysis Test Support

- [ ] Given the users/page.tsx file at line ~625, when scanning for Edit button className, then the className matches exactly `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` (no w-16 class present)
- [ ] Given the products/page.tsx file at line ~766, when scanning for Edit button className, then the className matches exactly `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` (no bg-blue-50 text-blue-700 pattern present)
- [ ] Given the CustomerListItem.tsx file at line ~181, when scanning for Edit button className, then the className matches exactly `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` (no bg-blue-100 text-blue-700 pattern present)
- [ ] Given the contracts/page.tsx file at line ~363, when scanning for Edit button className, then the className matches exactly `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` (no w-18 class present)
- [ ] Given the maintenances/page.tsx file at line ~622, when scanning for Edit button element type, then it is `<Link>` (not `<a>`) with className `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` and contains a pencil SVG icon (icon added)
- [ ] Given the blogs/page.tsx file at line ~399, when scanning for Edit button className, then the className matches exactly `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` (no w-14 class present)
- [ ] Given the InspectionsTable.tsx file at line ~321, when scanning for Edit button className, then the className matches exactly `inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90` and contains a pencil SVG icon (icon added, no w-16 class present, no bg-blue-100 text-blue-800 pattern present)
- [ ] Given the CustomerListItem.tsx file at line ~181 for Delete button, when scanning for Delete button className, then the className matches exactly `inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50` (no bg-red-100 text-red-700 pattern present)

## Scope: In / Out

### In Scope
- Edit buttons in:
  - users/page.tsx (line ~625)
  - products/page.tsx (line ~766)
  - CustomerListItem.tsx (line ~181)
  - contracts/page.tsx (line ~363)
  - maintenances/page.tsx (line ~622) — also fixes UI-106 (`<a>` → `<Link>`)
  - blogs/page.tsx (line ~399)
  - InspectionsTable.tsx (line ~321)
- Delete buttons in:
  - users/page.tsx (outline style — preserve)
  - contracts/page.tsx (outline style — preserve)
  - blogs/page.tsx (outline style — preserve)
  - CustomerListItem.tsx (filled style → convert to outline)
- Standard applies to:
  - Element type (`<Link>` for Edit, `<button>` for Delete)
  - className pattern (exact match)
  - Icon presence (pencil for Edit, trash for Delete)
  - No fixed widths (w-14, w-16, w-18 removed)

### Out of Scope
- Products dropdown delete button (different pattern, separate concern — tracked as UI-125)
- Any Edit or Delete button in mobile app
- Button hover/click behavior (preserve existing functionality)
- Button event handlers (preserve existing onClick/href logic)
- Layout or positioning of buttons within tables (preserve existing flex/grid structure)
- Translation/i18n of button text (preserve existing labels)

## Edge Cases

### Edit Button with No Icon Originally
**Context:** maintenances/page.tsx line ~622 and InspectionsTable.tsx line ~321 have no icon currently.
**Expected Behavior:** Add pencil SVG icon to these buttons. Icon position: left of any text label, with `gap-1` spacing applied via `inline-flex items-center gap-1` pattern.

### Maintenances Edit Button Using `<a>` Element
**Context:** maintenances/page.tsx line ~622 uses `<a href=...>` instead of `<Link>`.
**Expected Behavior:** Replace `<a>` with `<Link>` from `next/link`. Preserve `href` value as `<Link>` component's navigation target. This fixes UI-106 as bundled fix.

### Delete Button in Dropdown Context (Products Page)
**Context:** products/page.tsx has delete button inside dropdown menu with pattern `text-red-600 hover:bg-red-50` (different from table row delete buttons).
**Expected Behavior:** OUT OF SCOPE. Do not modify. This is tracked separately as UI-125 and requires stakeholder decision on dropdown menu button patterns.

### CustomerListItem Delete Button Filled Style
**Context:** CustomerListItem.tsx line ~181 uses filled style `bg-red-100 text-red-700` instead of outline style.
**Expected Behavior:** Convert to outline style `border border-red-300 bg-white text-red-600 hover:bg-red-50` to match majority pattern used in users/contracts/blogs pages.

## Technical Constraints

### Framework and Library Requirements
- Must use `<Link>` from `next/link` for Edit buttons (Next.js App Router convention)
- Must use `<button>` element for Delete buttons (triggers modal/confirmation dialog)
- SVG icons must be inline (no external icon library — preserve existing SVG code)

### Styling Requirements
- Tailwind CSS class-based styling only — no inline styles
- className pattern must match exactly as specified (QA will run static source grep tests)
- No CSS module imports or styled-components — project uses Tailwind exclusively

### Browser and Accessibility
- Button elements must remain keyboard-accessible (preserve existing tabindex if present)
- Link elements must remain screen-reader accessible (preserve existing aria-label if present)
- Hover states must work on both mouse and touch devices (`:hover` pseudoclass preserved)

### File Location Constraints
- All changes are within `website/` monorepo folder
- Files to modify:
  - `website/app/(admin)/admin/users/page.tsx`
  - `website/app/(admin)/admin/products/page.tsx`
  - `website/app/(admin)/admin/customers/components/CustomerListItem.tsx`
  - `website/app/(admin)/admin/contracts/page.tsx`
  - `website/app/(admin)/admin/maintenances/page.tsx`
  - `website/app/(admin)/admin/blogs/page.tsx`
  - `website/components/Admin/InspectionsTable.tsx`
- Mobile app files (`mobile-apps/`) are not affected

## Open Questions

**None.** All standards confirmed, scope defined, out-of-scope items explicitly listed. Ready to hand to quality-assurance.
