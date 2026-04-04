# Customers Specification

## Overview
Customer management for fire protection and security service clients. Managed via admin dashboard.

## Entity: Customer
| Field | Type | Description |
|-------|------|-------------|
| name | string | Customer/company name |
| customerType | enum | "individual" \| "corporate" \| "government" \| "nonprofit" |
| businessField | string | Industry/business category |
| address | CustomerAddress | Full Indonesian address hierarchy |
| contacts | ContactPerson[] | Multiple contact persons |
| primaryContactId | string | ID of primary contact from contacts array |
| createdAt | Timestamp | Creation timestamp |
| createdBy | DocumentReference | Reference to creating user |
| updatedAt | Timestamp | Last update timestamp |
| updatedBy | DocumentReference | Reference to updating user |

### CustomerAddress
street, village (kelurahan), district (kecamatan), city (kabupaten), province, postalCode, coordinates (lat/lng)

### ContactPerson
name, phone, email, position

## Business Rules
- Customers can be individual, corporate, government, or nonprofit
- Indonesian address hierarchy: street → village/kelurahan → district/kecamatan → city/kabupaten → province
- Multi-contact support with primary contact designation
- Legacy single-contact field exists (`contact?: {...}`) — migration incomplete
- Customers can be imported via CSV/Excel in admin dashboard
- Customer is linked to contracts (one customer can have many contracts)

## Admin Dashboard Features
- CRUD operations for customers
- CSV/Excel import
- Search and filter by type, name
- View linked contracts

## Open Questions
- What triggers customer deactivation?
- Are there validation rules for business fields?
- Is the legacy contact field migration planned?
- Can a customer be deleted if they have active contracts?
