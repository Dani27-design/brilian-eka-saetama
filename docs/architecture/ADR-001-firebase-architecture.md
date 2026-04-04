# ADR-001: Firebase as Sole Backend

## Status
Accepted (existing architecture — documented during Workflow 0)

## Context
PT Brilian Eka Saetama needs a backend for both their Next.js website and React Native mobile app. The system manages fire protection equipment, maintenance scheduling, inspections, and customer/contract data.

## Decision
Firebase serves as the sole backend infrastructure:
- **Firestore** for document database (NoSQL)
- **Firebase Auth** for authentication (email, Google, Apple, SMS)
- **Firebase Storage** for file/image storage
- **Firebase Cloud Functions** for server-side processing (uploadMedia)
- **Firebase Hosting** configured (firebase.json present)

No separate REST API server or traditional database exists. The website uses Next.js API routes with Firebase Admin SDK for server-side operations.

## Rationale
- Single platform for both web and mobile clients
- Real-time data synchronization via Firestore listeners
- Built-in authentication with multiple providers
- Serverless — no infrastructure management
- Cost-effective for current scale

## Consequences
- All data modeling constrained by Firestore's document/collection model
- No SQL joins — relationships via DocumentReferences require N+1 queries
- Security rules must be comprehensive (currently wide-open — critical risk)
- Vendor lock-in to Google Cloud ecosystem
- Limited query capabilities compared to SQL databases
- Composite indexes must be explicitly defined for multi-field queries

## Alternatives Considered
- None documented — Firebase was the original architectural choice
