# ADR-002: Monorepo Structure

## Status
Accepted (existing architecture — documented during Workflow 0)

## Context
The project has two client applications: a Next.js website (public site + admin dashboard) and a React Native mobile app (field inspection tool). Both share the same Firebase backend project.

## Decision
Both applications live in a single repository with independent package management:
- `/website` — Next.js 13 application (TypeScript)
- `/mobile-apps` — React Native 0.71 application (JavaScript)
- No shared code packages between them
- Each has its own package.json, dependencies, and build pipeline
- Documentation is co-located per app (`website/docs/`, `mobile-apps/docs/`)

## Rationale
- Single repository for all project code
- Simplified version control and code review
- Both apps share the same Firebase project and data model

## Consequences
- No shared code library — types and models are duplicated across apps
- Independent dependency management (different Node versions may be needed)
- No monorepo tooling (no Nx, Turborepo, or Lerna)
- Website uses TypeScript, mobile uses JavaScript — type definitions not shared
- Changes to shared Firestore schema require updates in both apps

## Alternatives Considered
- Separate repositories per app — rejected for simplicity
- Monorepo with shared packages (Nx/Turborepo) — not implemented but could improve type sharing and consistency
