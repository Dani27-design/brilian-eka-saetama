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

| Status | Description | Who triggers |
|--------|-------------|-------------|
| pending | Created, no engineer assigned | Admin creates |
| scheduled | Engineer(s) assigned | Admin assigns |
| in_progress | Engineer started work | Engineer starts |
| waiting_approval | Inspection submitted | Engineer submits |
| approved | Admin approved inspection | Admin approves |
| rejected | Admin rejected, needs rework | Admin rejects |

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

## Mobile App Features
- View assigned maintenance tasks
- Start inspection workflow
- Submit completed inspection

## Open Questions
- Can multiple engineers work on the same maintenance simultaneously?
- What notification is sent when maintenance is assigned/approved/rejected?
- Is there an overdue alert when maintenance passes its scheduled date?
- Can a maintenance be cancelled/deleted?
