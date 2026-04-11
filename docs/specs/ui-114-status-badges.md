# UI-114: Status Badge Standardization

## Summary
Standard pill-style status badges across admin dashboard for maintenance status and contract status display.

## User Story
As an admin user, I want consistent visual status indicators across all entity tables and detail views, so that I can quickly identify the state of contracts and maintenance tasks at a glance.

## Acceptance Criteria

### AC-1: Standard Badge Pattern
- **Given** any entity status is displayed
- **When** the status badge is rendered
- **Then** it uses the standard pill pattern: `inline-flex rounded-full px-2 py-1 text-xs font-medium`

### AC-2: Maintenance Status Color Mapping
- **Given** a maintenance record with any valid status
- **When** the status badge is displayed
- **Then** the correct color mapping is applied:
  - `pending` → `bg-gray-100 text-gray-700` (gray)
  - `scheduled` → `bg-blue-100 text-blue-700` (blue)
  - `in_progress` → `bg-purple-100 text-purple-700` (purple)
  - `waiting_approval` → `bg-yellow-100 text-yellow-700` (yellow)
  - `approved` → `bg-green-100 text-green-700` (green)
  - `rejected` → `bg-red-100 text-red-700` (red)

### AC-3: Contract Status Color Mapping
- **Given** a contract record with any valid status
- **When** the status badge is displayed
- **Then** the correct color mapping is applied:
  - `active` → `bg-green-100 text-green-700` (green)
  - `inactive` → `bg-gray-100 text-gray-700` (gray)
  - `terminated` → `bg-red-100 text-red-700` (red)

### AC-4: Display Text Localization
- **Given** any status badge is rendered
- **When** the text content is displayed
- **Then** it shows the Indonesian localized text:

**Maintenance statuses:**
  - `pending` → "Menunggu"
  - `scheduled` → "Dijadwalkan"
  - `in_progress` → "Sedang Dikerjakan"
  - `waiting_approval` → "Menunggu Persetujuan"
  - `approved` → "Disetujui"
  - `rejected` → "Ditolak"

**Contract statuses:**
  - `active` → "Aktif"
  - `inactive` → "Tidak Aktif"
  - `terminated` → "Dihentikan"

### AC-5: SharedStatusBadge Component Usage
- **Given** a status badge needs to be rendered
- **When** the component is implemented
- **Then** it uses the `SharedStatusBadge` component at `/website/components/Admin/SharedStatusBadge.tsx`
- **And** the component receives `status` prop (string) and `type` prop (`"maintenance"` or `"contract"`)

### AC-6: Badge Display Location
- **Given** any admin dashboard page that displays entity status
- **When** the page is rendered
- **Then** status badges are displayed in:
  - Table list views (maintenance table, contract table)
  - Detail views (maintenance detail page, contract detail page)
  - Any modal or card component showing status

## Scope

### In Scope
- Maintenance status badges (all 6 statuses: pending, scheduled, in_progress, waiting_approval, approved, rejected)
- Contract status badges (all 3 statuses: active, inactive, terminated)
- SharedStatusBadge component implementation
- Standard Tailwind color palette for status badges
- Indonesian localized display text

### Out of Scope
- Product status badges (products do not have a status field)
- Customer status badges (customers do not have a status field)
- User status badges (users have active/inactive but this is not yet standardized)
- English language translation (website is Indonesian-only)
- Status badges in mobile app (mobile app has different UI patterns)
- `cancelled` and `overdue` maintenance statuses (mobile app defines these but does not write them to Firestore)

## Edge Cases

### EC-1: Unknown Status Value
- **Given** a maintenance or contract record has an unexpected status value not in the defined enum
- **When** the status badge is rendered
- **Then** it displays the raw status value with default gray styling (`bg-gray-100 text-gray-700`) and logs a warning to console

### EC-2: Null or Missing Status
- **Given** a maintenance or contract record has null or undefined status
- **When** the status badge is rendered
- **Then** it displays "Status Tidak Diketahui" with gray styling and logs a warning to console

## Technical Constraints
- Uses Tailwind CSS 3.x utility classes only — no custom CSS classes
- Status badge component must be functional component with TypeScript type safety
- Color palette follows Tailwind's 100/700 shade pattern for accessible contrast
- Component must be reusable across all admin dashboard pages

## Open Questions
None — all design decisions confirmed with stakeholder.

## Related Specifications
- `maintenances.md` — Maintenance status workflow and badge display
- `contracts.md` — Contract status workflow and badge display
- `ui-113-117-button-standardization.md` — Related UI standardization effort
