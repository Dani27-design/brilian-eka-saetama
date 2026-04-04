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

## Mobile App Features
- QR code scanner for product identification
- Digital inspection form with product-specific checklist
- Photo capture with watermark (location, timestamp)
- Offline data save and sync
- View submission history

## Open Questions
- Can checksheet templates be versioned? What happens to old inspections when template changes?
- Is there a minimum number of photos required?
- What geolocation accuracy is required for watermarks?
- Can an inspection be partially saved and resumed later?
