# Feature: UI-102 — Contracts Page Action Buttons Horizontal Layout

## Summary
Align the Contracts page action buttons layout to match the horizontal pattern used consistently across the admin dashboard (Users, Blogs pages), eliminating visual inconsistency and improving professional appearance.

## User Story
As an admin user, I want the action buttons on the Contracts page to be displayed horizontally in a single row like they are on the Users and Blogs pages, so that the interface feels consistent and professional across all admin tables.

## Acceptance Criteria

- [ ] **Given** the Contracts page table is rendered with at least one contract row, **when** viewing the Actions column, **then** the action buttons must be displayed horizontally in a single row, not stacked vertically.

- [ ] **Given** the Contracts page table Actions column, **when** inspecting the button container element, **then** it must use the class `flex space-x-2` (not `flex flex-col flex-wrap gap-2`).

- [ ] **Given** multiple contract rows are rendered, **when** viewing all Actions columns, **then** all button groups must maintain horizontal alignment consistently across all rows.

- [ ] **Given** the Contracts page is rendered on desktop viewport (1024px+), **when** viewing the Actions column, **then** all action buttons (Edit, Delete) must be visible in the same row without wrapping or truncation.

- [ ] **Given** the Contracts page is rendered on tablet viewport (768px-1023px), **when** viewing the Actions column, **then** all action buttons must remain visible horizontally without layout breakage.

- [ ] **Given** the Contracts page is rendered, **when** comparing the Actions column layout to Users page and Blogs page, **then** all three pages must use identical horizontal button layout pattern.

## Current vs Expected Behavior

**Current (line 362 in `website/app/(admin)/admin/contracts/page.tsx`):**
```tsx
<div className="p-auto flex flex-col flex-wrap gap-2">
  {/* Action buttons stacked vertically */}
</div>
```

**Expected (matching Users and Blogs pages):**
```tsx
<div className="flex space-x-2">
  {/* Action buttons arranged horizontally */}
</div>
```

## Scope: In / Out

**In Scope:**
- Change the Actions column button container class from `flex flex-col flex-wrap gap-2` to `flex space-x-2` in Contracts page only
- Verify horizontal layout renders correctly at desktop and tablet viewports
- Ensure visual consistency with Users and Blogs pages action buttons

**Out of Scope:**
- Mobile app changes (mobile-apps/ folder — completely isolated UI layer)
- Other admin pages not explicitly mentioned (Users, Blogs, Contracts are the only pages in scope)
- Changes to button styles, icons, colors, or functionality — layout only
- Changes to button click behavior or routing
- Responsive behavior below tablet viewport (768px) — this spec covers desktop and tablet only; mobile viewport behavior is handled separately if needed

## Edge Cases

**Edge Case 1: Very narrow viewport**
- Viewport width < 768px is outside the scope of this spec. If buttons wrap or stack at mobile viewport, that is acceptable and does not violate this spec.

**Edge Case 2: Long contract names causing table cell width constraints**
- The action buttons column should maintain fixed width sufficient for horizontal layout regardless of other column content width. The buttons must not wrap due to table layout constraints.

**Edge Case 3: Varying number of action buttons per row**
- If for any reason a row has fewer action buttons than others (e.g., conditional rendering based on permissions), the horizontal layout must still be maintained with proper spacing between visible buttons.

## Technical Constraints

- Must use Tailwind CSS utility classes only (no custom CSS)
- Must not modify button component internals or icon rendering
- Must not change the button order (Edit → Delete sequence must be preserved)
- Change is limited to the container `div` class attribute at line 362 in `website/app/(admin)/admin/contracts/page.tsx`

## Open Questions

None. All information required to implement and test this change is confirmed.

---

**Hand-off to quality-assurance:** This spec is complete and ready for RED test writing. The acceptance criteria are specific enough to write visual regression tests or component rendering tests that verify the class name and horizontal layout behavior.
