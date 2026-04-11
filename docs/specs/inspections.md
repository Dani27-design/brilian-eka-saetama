# Inspections Specification

## Overview
Field inspection process performed by engineers on fire protection equipment. Nested within maintenance records.

## Entity: Inspection (nested in Maintenance)
| Field | Type | Description |
|-------|------|-------------|
| checklist | InspectionChecklist | Product-type-specific checklist items |
| photos | string[] | Array of photo URLs |
| createdAt | Timestamp | When inspection was created |
| createdBy | DocumentReference | Engineer who created |
| updatedAt | Timestamp | Last update |
| updatedBy | DocumentReference | Last updater |

## Inspection Checklists by Product Type

### APAR (Fire Extinguisher)
- Hose condition (OK/NOK + remarks)
- Pressure gauge (OK/NOK + remarks)
- Handle condition (OK/NOK + remarks)
- Body condition (OK/NOK + remarks)
- Safety pin (OK/NOK + remarks)
- Expiry date check (OK/NOK + remarks)

### Other Product Types
Each product type has its own specific checklist items. Templates managed via admin dashboard "Checksheet" feature.

## Inspection Workflow
1. Engineer scans product QR code (or selects manually)
2. System loads maintenance record and product-type-specific checklist
3. Engineer fills checklist items (OK/NOK + optional remarks per item)
4. Engineer takes photos (watermarked with location + timestamp)
5. Engineer submits inspection → maintenance status becomes "waiting_approval"
6. Admin reviews checklist results and photos
7. Admin approves or rejects (with rejection reason)
8. If rejected: engineer can edit and resubmit

## Business Rules
- Checklist is determined by product type
- Each checklist item has OK/NOK status and optional remarks
- Photos are watermarked with geolocation and timestamp
- Engineer must have maintenance assigned to them to submit inspection
- Approved inspections are read-only (cannot be modified)
- Inspection data generates certificates viewable via public URL

## Public Certificate Access
- Public URL: `/product/[productId]/certificates`
- Accessible via QR code scan
- Shows inspection history and results
- No authentication required for viewing

## Admin Dashboard Features
- View/edit inspection results
- Create/edit checksheet templates per product type
- Approve/reject inspections
- Filter by search text, product type, status, date range

## Mobile App Features
- QR code scanner for product identification
- Digital inspection form with product-specific checklist
- Photo capture with watermark (location, timestamp)
- Offline data save and sync
- View submission history

## Filtering and Search (UI-120)

### Filter Fields Available
| Field | Type | Options | Description |
|-------|------|---------|-------------|
| Search Text | text input | n/a | Searches contractNumber, productNumber, productName |
| Product Type | dropdown | "Semua Jenis", "APAR", "HYDRANT", "CCTV", "FIRE_ALARM", "ACCESS_DOOR", "PATROL_GUARD" | Filters by productType field |
| Status | dropdown | "Semua Status", "Tertunda" (pending), "Dijadwalkan" (scheduled), "Menunggu Disetujui" (waiting_approval), "Disetujui" (approved), "Ditolak" (rejected) | Filters by maintenance status |
| Date From | date input | n/a | Filters inspections with inspection date >= this date (time set to 00:00:00) |
| Date To | date input | n/a | Filters inspections with inspection date <= this date (time set to 23:59:59) |

### Filter Layout and Behavior (Updated for UI-120)
- Filter section layout: `flex flex-wrap items-end gap-4`
- Filter section container: `rounded-lg border border-stroke bg-white p-4`
- Grid layout within container removed — replaced with flex layout for better wrapping
- All filter fields aligned to bottom (items-end) so labels and inputs align consistently
- Each filter field has a label above it (`text-xs font-medium text-gray-600 mb-1 block`)
- When no filter is selected (dropdown value is "" or date input is empty), show all inspections (no filtering applied for that field)

### Reset Filter Button
**Acceptance Criteria:**
- Given the inspections page is loaded
- When the user clicks the "Reset Filter" button
- Then all filter dropdowns (product type, status) are reset to their default values:
  - Product Type: "" (empty — shows "Semua Jenis" in UI)
  - Status: "" (empty — shows "Semua Status" in UI)
- And both date inputs (date from, date to) are cleared (set to "")
- And the search text input is NOT cleared (preserveSearch = true)
- And the filtered table reflects the reset state (no filters applied except search text if present)

**Button Styling:**
- Classes: `rounded-lg border border-stroke px-4 py-2 text-xs font-medium hover:bg-gray-100`
- Label: "Reset Filter" (exact text, not "Reset" or "Clear Filters")
- Position: within the filter section, aligned with filter inputs (items-end)

### Existing Search Behavior (Unchanged)
- Search text filters contractNumber, productNumber, and productName fields
- Case-insensitive match using `.toLowerCase().includes(searchTerm.toLowerCase())`
- Search text is independent from other filters

### Existing Filtering Logic (Unchanged)
- All filters are applied client-side via `applyFilters()` function
- Filters combine with AND logic (all active filters must match)
- Date filters compare inspection.inspectionDate (parsed as Date object) against filterDateFrom and filterDateTo

## Open Questions
- Can checksheet templates be versioned? What happens to old inspections when template changes?
- Is there a minimum number of photos required?
- What geolocation accuracy is required for watermarks?
- Can an inspection be partially saved and resumed later?
