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
- Filter by status, type, customer

## Open Questions
- What happens to products when a contract is terminated?
- Can a terminated contract be reactivated?
- Is the "same product can't be in different contracts" rule enforced at DB level?
- How are contract renewals handled?
