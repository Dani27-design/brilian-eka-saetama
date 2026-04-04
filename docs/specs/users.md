# Users Specification

## Overview
User account management with role-based access control across website and mobile app.

## Entity: User
| Field | Type | Description |
|-------|------|-------------|
| createdAt | Timestamp | Account creation timestamp |
| email | string | User email address |
| isActive | boolean | Account active status |
| name | string | Display name |
| photoURL | string | Profile photo URL |
| role | enum | "admin" \| "engineer" \| "user" |

## Roles and Access

### Admin
- **Website**: Full admin dashboard access
  - CRUD: users, customers, products, contracts, maintenances
  - Approve/reject inspections
  - Manage content (blog, CMS sections)
  - View analytics
  - Import/export data
- **Mobile**: View all maintenance tasks, approve/reject inspections

### Engineer
- **Website**: No admin dashboard access
- **Mobile**:
  - View assigned maintenance tasks
  - Perform inspections (QR scan, checklist, photos)
  - Submit inspections for approval
  - View own inspection history

### User/Client
- **Website**: Public pages only (no dashboard)
- **Mobile**:
  - View their own equipment/products (read-only)
  - View inspection history for their equipment
  - Browse news and promotions

## Authentication
- Firebase Auth with multiple providers:
  - Email/password
  - Google Sign-In
  - Apple Sign-In (iOS)
  - SMS/Phone (mobile)
  - Facebook (mobile, optional)
- Session management via Firebase Auth tokens

## Business Rules
- Users are created by admin via dashboard or API
- Role determines navigation and feature access in both apps
- isActive flag can disable account without deletion
- Admin can create users with any role (including other admins)
- Engineers can only access their own assigned tasks
- Clients can only view their own linked equipment

## Admin Dashboard Features
- Create/edit user accounts
- Assign roles
- Activate/deactivate accounts

## Security Concerns (from Workflow 0 audit)
- API routes for user creation have NO authentication checks
- Anyone can create admin users via POST /api/users
- SignOut function on website doesn't call Firebase auth.signOut()
- Firestore rules allow unrestricted access

## Open Questions
- Is there a password policy?
- Can users self-register or only admin-created?
- How is the user-to-customer relationship established for clients?
- Are there user activity logs?
