# Maintenances Specification

## Overview
Scheduled maintenance tasks for fire protection equipment. Created by admin, executed by engineers via mobile app.

## Entity: Maintenance
| Field | Type | Description |
|-------|------|-------------|
| id | string | Document ID |
| contract | DocumentReference | Linked contract |
| product | DocumentReference | Specific product to maintain |
| productType | ProductType | Product type (determines checklist) |
| engineer | DocumentReference[] \| null | Assigned engineer(s) |
| status | enum | Maintenance workflow status |
| startDate | Timestamp | Scheduled start |
| endDate | Timestamp | Scheduled end |
| inspection | Inspection \| null | Inspection data (filled by engineer) |
| createdAt/updatedAt | Timestamp | Audit timestamps |
| createdBy/updatedBy | DocumentReference | Audit user references |

## Status Workflow (State Machine)
```
pending → scheduled → in_progress → waiting_approval → approved
                                                      → rejected → (engineer edits) → waiting_approval
```

| Status | Description | Who triggers | Display Text |
|--------|-------------|-------------|--------------|
| pending | Created, no engineer assigned | Admin creates | "Menunggu" |
| scheduled | Engineer(s) assigned | Admin assigns | "Dijadwalkan" |
| in_progress | Engineer started work | Mobile app when engineer starts inspection | "Sedang Dikerjakan" |
| waiting_approval | Inspection submitted | Engineer submits | "Menunggu Persetujuan" |
| approved | Admin approved inspection | Admin approves | "Disetujui" |
| rejected | Admin rejected, needs rework | Admin rejects | "Ditolak" |

**Note on `in_progress` status:**
- This status is written to Firestore by the mobile app when an engineer starts an inspection
- The website previously did not display this status — it now does
- Mobile app defines additional statuses (`cancelled`, `overdue`) but does NOT write them to Firestore — these are NOT implemented in the workflow

## Status Badge Display (Website)
Status badges follow the standard pill pattern (see `ui-114-status-badges.md` for full spec).

| Status | Tailwind Classes | Color |
|--------|-----------------|-------|
| pending | `bg-gray-100 text-gray-700` | Gray |
| scheduled | `bg-blue-100 text-blue-700` | Blue |
| in_progress | `bg-purple-100 text-purple-700` | Purple |
| waiting_approval | `bg-yellow-100 text-yellow-700` | Yellow |
| approved | `bg-green-100 text-green-700` | Green |
| rejected | `bg-red-100 text-red-700` | Red |

## Business Rules
- Admin creates maintenance record linked to contract and product
- One or more engineers can be assigned
- Engineer can only edit in statuses: scheduled, in_progress, waiting_approval, rejected
- Engineer cannot edit approved inspections (workflow integrity)
- Admin can edit all statuses
- Rejected inspections return to engineer for rework
- Maintenance frequency driven by product's maintenanceInterval

## Admin Dashboard Features
- Create/schedule maintenance tasks
- Assign engineers
- Calendar view of scheduled maintenance
- Review and approve/reject inspections
- View maintenance status badges in table and detail views

## Mobile App Features
- View assigned maintenance tasks
- Start inspection workflow (sets status to `in_progress`)
- Submit completed inspection (sets status to `waiting_approval`)

## Open Questions
- Can multiple engineers work on the same maintenance simultaneously?
- What notification is sent when maintenance is assigned/approved/rejected?
- Is there an overdue alert when maintenance passes its scheduled date?
- Can a maintenance be cancelled/deleted?
