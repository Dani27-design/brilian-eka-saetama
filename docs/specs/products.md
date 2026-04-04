# Products Specification

## Overview
Fire protection and security equipment catalog. Managed via admin dashboard, scanned via QR code in mobile app.

## Entity: Product
| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| name | string | Product name |
| productNumber | number | Unique product number |
| productType | enum | "APAR" \| "HYDRANT" \| "CCTV" \| "FIRE_ALARM" \| "ACCESS_DOOR" \| "PATROL_GUARD" |
| specs | ProductSpecs | Type-specific technical specifications |
| source | string | Product source/origin |
| maintenanceInterval | number | Days between maintenance checks |
| imageUrl | string | Product image URL |
| contract | DocumentReference \| null | Linked contract (null = unassigned) |
| createdAt/updatedAt | Timestamp | Audit timestamps |
| createdBy/updatedBy | DocumentReference | Audit user references |

## Product Types
1. **APAR** — Fire Extinguisher (Alat Pemadam Api Ringan)
2. **HYDRANT** — Fire Hydrant system
3. **CCTV** — Surveillance cameras
4. **FIRE_ALARM** — Fire alarm systems
5. **ACCESS_DOOR** — Access control doors
6. **PATROL_GUARD** — Guard patrol systems

Each type has specific specs and inspection checklists.

## Business Rules
- Each product has a unique product number
- Products are linked to contracts (one product → one contract)
- Unassigned products have `contract: null`
- QR codes are generated per product for field identification
- Product type determines which inspection checklist is used
- maintenanceInterval defines scheduled maintenance frequency

## Admin Dashboard Features
- CRUD operations for products
- Bulk import via CSV/Excel
- QR code generation (individual and batch)
- Filter by type, contract, source
- Link/unlink to contracts

## Mobile App Features
- QR code scanning to identify product
- View product details and specs
- Access inspection history

## Open Questions
- What data is encoded in the QR code?
- Can product type be changed after creation?
- What happens to maintenance records when a product is unlinked from a contract?
