# Feature: UI-112 — Admin Dashboard Dark Mode Dead Code Removal

## Summary
Remove all dead `dark:*` Tailwind classes from admin dashboard files. The admin dashboard forces light mode via `forcedTheme="light"` in `AdminLayoutClient.tsx` (lines 197, 221), making all `dark:*` classes unreachable and dead code. This cleanup improves code readability, reduces confusion, and eliminates inconsistency across admin files.

Public site dark mode functionality is explicitly preserved — no changes to public site files.

## User Story
As a developer maintaining the admin dashboard, I want all dead dark mode Tailwind classes removed, so that I can read and modify admin UI code without being distracted by unreachable CSS classes that never activate.

## Acceptance Criteria

### AC-1: All dark mode classes removed from admin scope
**Given** all files under `website/app/(admin)/**` and `website/components/Admin/**`
**When** code cleanup is complete
**Then** zero occurrences of `dark:` Tailwind classes remain in any file within admin scope

### AC-2: Preview components cleaned
**Given** Preview components (BlogPreview.tsx, HeroPreview.tsx, HeaderPreview.tsx, AboutPreview.tsx, FooterPreview.tsx, and any other *Preview.tsx components)
**When** code cleanup is complete
**Then**:
- All `dark:*` Tailwind classes are removed from these components
- Any `useTheme` imports, `theme` state, or conditional rendering logic that exists solely for dark mode is removed
- If `useTheme` is used for purposes other than dark mode (unlikely but possible), only dark mode references are removed

### AC-3: Public site dark mode preserved
**Given** all files under `website/app/(site)/**` and `website/components/Site/**`
**When** code cleanup is complete
**Then**:
- Dark mode functionality remains fully intact
- Dark mode toggle in public site UI continues to work
- All `dark:*` classes in public site files remain untouched
- `website/app/globals.css` is not modified
- `website/tailwind.config.js` is not modified

### AC-4: Shared utility files preserved
**Given** `website/components/Lines/**` and `website/components/ErrorPages/**`
**When** code cleanup is complete
**Then**:
- These files are not modified
- Any `dark:*` classes in these shared files remain untouched

### AC-5: No functional change to admin dashboard
**Given** the admin dashboard after cleanup
**When** rendered in any browser
**Then**:
- Visual appearance is identical to before cleanup
- All UI interactions work exactly as before
- No runtime errors occur
- No console warnings appear

### AC-6: Mobile app unaffected
**Given** the mobile app codebase (`mobile-apps/**`)
**When** code cleanup is complete
**Then**:
- Zero files in mobile-apps directory are modified
- Mobile app dark mode (React Native StyleSheet-based) continues to function independently

## Scope: In / Out

### In Scope
- **Admin route files:** All files in `website/app/(admin)/**`
- **Admin components:** All files in `website/components/Admin/**`
- **Preview components:** All *Preview.tsx components (BlogPreview, HeroPreview, HeaderPreview, AboutPreview, FooterPreview, etc.) regardless of location
- **Action:** Remove all `dark:*` Tailwind classes from these files
- **Action:** Remove `useTheme` imports and theme-conditional logic in Preview components if used solely for dark mode

### Out of Scope
- **Public site route files:** `website/app/(site)/**` — NO CHANGES
- **Public site components:** `website/components/Site/**` — NO CHANGES
- **Shared utilities:** `website/components/Lines/**`, `website/components/ErrorPages/**` — NO CHANGES
- **Global styles:** `website/app/globals.css` — NO CHANGES
- **Tailwind config:** `website/tailwind.config.js` — NO CHANGES
- **Mobile app:** `mobile-apps/**` — NO CHANGES
- **Dark mode configuration:** `forcedTheme="light"` in AdminLayoutClient.tsx remains unchanged

## Edge Cases

### Preview Components with Mixed Logic
**Scenario:** A Preview component uses `useTheme()` for both dark mode AND another purpose (e.g., theme customization beyond dark/light).
**Expected behavior:** Remove only the dark mode references. If `useTheme` is required for other purposes, leave the hook and remove only dark-mode-specific conditionals and `dark:*` classes.
**Likelihood:** Low — Preview components are typically simple display components.

### Shared Components Used by Both Admin and Public Site
**Scenario:** A component exists in `website/components/` root (not in Admin/ or Site/ subdirectories) and is imported by both admin and public site pages.
**Expected behavior:** Leave all `dark:*` classes in such components intact — they may be required for public site dark mode even if admin does not use them.
**How to identify:** Check for imports from admin pages AND public site pages. If both exist, preserve dark mode classes.

### Inline Tailwind Classes vs. CSS Modules
**Scenario:** Some admin files use CSS modules or styled-components instead of inline Tailwind classes.
**Expected behavior:** This spec covers only Tailwind `dark:*` classes. If CSS modules contain `.dark` selectors, they are out of scope unless they are confirmed to be exclusively used by admin files.

### AdminLayoutClient.tsx `forcedTheme="light"` Removal
**Scenario:** Developer considers removing `forcedTheme="light"` to "restore" dark mode.
**Expected behavior:** DO NOT remove `forcedTheme="light"` — this is the source of truth that admin is intentionally light-only. Stakeholder decision: admin remains light-only, dead code is removed, NOT the other way around.

## Technical Constraints

- **Constraint 1:** Use automated tooling where possible (regex find/replace, linters) to reduce manual error.
- **Constraint 2:** Verify via grep/ripgrep after cleanup that zero `dark:` occurrences remain in admin scope files.
- **Constraint 3:** Run visual regression checks (manual or automated) on key admin pages to confirm no visual changes.
- **Constraint 4:** Do not modify line counts unnecessarily — remove only the `dark:*` classes, not surrounding formatting or unrelated code.
- **Constraint 5:** Estimated file count: ~100+ files. Use batch processing to avoid missing files.

## Open Questions

**None.** All decisions resolved:
- ✅ Scope: admin files only, public site preserved (stakeholder confirmed)
- ✅ Preview components: remove dark: classes AND theme logic if dark-mode-only (stakeholder confirmed)
- ✅ forcedTheme="light": remains unchanged (stakeholder confirmed)
- ✅ Mobile app: zero impact, no changes needed (independent dark mode)

---

**Spec ready for handoff to quality-assurance.**
