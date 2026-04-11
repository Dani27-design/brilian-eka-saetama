# Contracts Specification

## Overview
Service contracts linking customers to fire protection/security products. Managed via admin dashboard.

## Entity: Contract
| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| contractNumber | string | Unique contract identifier |
| contractName | string | Human-readable contract name |
| contractType | enum | "service" \| "maintenance" \| "rental" \| "sales" \| "other" |
| contractDescription | string | Contract details |
| customer | DocumentReference | Reference to customer |
| startDate | Timestamp | Contract start |
| endDate | Timestamp \| null | Contract end (null = indefinite) |
| status | enum | "active" \| "inactive" \| "terminated" |
| products | DocumentReference[] | Array of product references |
| productDetails | ProductDetail[] | Per-product service configuration |
| createdAt/updatedAt | Timestamp | Audit timestamps |
| createdBy/updatedBy | DocumentReference | Audit user references |

### ProductDetail
| Field | Type | Description |
|-------|------|-------------|
| product | DocumentReference | Reference to product |
| location | string | Product installation location |
| maintenance | boolean | Maintenance service flag |
| service | boolean | Service flag |
| rental | boolean | Rental flag |
| sales | boolean | Sales flag |

## Status Badge Display (Website)
Status badges follow the standard pill pattern (see `ui-114-status-badges.md` for full spec).

| Status | Tailwind Classes | Color | Display Text |
|--------|-----------------|-------|--------------|
| active | `bg-green-100 text-green-700` | Green | "Aktif" |
| inactive | `bg-gray-100 text-gray-700` | Gray | "Tidak Aktif" |
| terminated | `bg-red-100 text-red-700` | Red | "Dihentikan" |

## Business Rules
- Contract links one customer to one or more products
- Same product cannot appear twice in same contract
- Same product cannot be in different contracts (uniqueness constraint — implied, needs verification)
- Contract types determine service scope
- Status workflow: active → inactive/terminated
- Products in contract have per-product location and service flags

## Admin Dashboard Features
- CRUD operations for contracts
- Link/unlink products to contracts
- View linked customer and products
- Filter by search text, status, contractType, customer
- View contract status badges in table and detail views

## Filtering and Search (UI-120)

### Filter Fields Available
| Field | Type | Options | Description |
|-------|------|---------|-------------|
| Search Text | text input | n/a | Searches contractNumber, customerName, productDetailsDisplay |
| Status | dropdown | "Semua Status", "Aktif" (active), "Tidak Aktif" (inactive), "Dihentikan" (terminated) | Filters by contract status |
| Contract Type | dropdown | "Semua Tipe", "service", "maintenance", "rental", "sales", "other" | Filters by contractType field |
| Customer | dropdown | "Semua Pelanggan", [list of customer names from customer refs] | Filters by customer reference |

### Filter Layout and Behavior
- Filter section: `flex flex-wrap items-end gap-4`
- All filter fields are dropdowns except search text (text input)
- Search text input retains existing placeholder: "Cari kontrak..."
- Each filter field has a label above it (`text-xs font-medium text-gray-600 mb-1`)
- When no filter is selected (dropdown value is ""), show all contracts

### Reset Filter Button
**Acceptance Criteria:**
- Given the contracts page is loaded
- When the user clicks the "Reset Filter" button
- Then all filter dropdowns (status, contractType, customer) are reset to their default empty value ("")
- And the search text input is NOT cleared (preserveSearch = true)
- And the filtered table reflects the reset state (no filters applied except search text if present)

**Button Styling:**
- Classes: `rounded-lg border border-stroke px-4 py-2 text-xs font-medium hover:bg-gray-100`
- Label: "Reset Filter" (exact text, not "Reset" or "Clear Filters")
- Position: within the filter section, aligned with filter inputs (items-end)

### Existing Search Behavior (Unchanged)
- Search text filters contractNumber, customerName, and productDetailsDisplay fields (joined as comma-separated string)
- Case-insensitive match using `.toLowerCase().includes(searchTerm.toLowerCase())`
- When search text changes, reset currentPage to 1

## Open Questions
- What happens to products when a contract is terminated?
- Can a terminated contract be reactivated?
- Is the "same product can't be in different contracts" rule enforced at DB level?
- How are contract renewals handled?
