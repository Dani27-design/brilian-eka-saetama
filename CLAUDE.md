# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Next.js 13+ application for PT Brilian Eka Saetama - a corporate website with admin dashboard capabilities. The project uses Firebase for backend services and Tailwind CSS for styling.

## Tech Stack
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **State Management**: React Query (TanStack Query)
- **Authentication**: Firebase Auth
- **Rich Text Editor**: React Draft WYSIWYG / MDXEditor
- **Deployment**: Configured for standalone Next.js output

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Sitemap generation (runs automatically after build)
npm run postbuild
```

## Architecture Overview

### Directory Structure
- `/app` - Next.js App Router structure
  - `/(site)` - Public-facing website routes
  - `/(admin)` - Admin dashboard routes with auth protection
  - `/api` - API routes for analytics and data management
  - `/context` - React context providers (Admin, Language, Toast)
  
- `/components` - Reusable React components
  - `/Admin` - Admin dashboard components
  - `/Site` - Public website components (Hero, Footer, Header, etc.)
  
- `/actions` - Server actions for CRUD operations
- `/db/firebase` - Firebase configuration and admin SDK
- `/types` - TypeScript type definitions
- `/services` - Service layer (analytics, etc.)

### Key Patterns

#### Route Groups
- `(site)` - Public routes with site layout (Header, Footer, ScrollToTop)
- `(admin)` - Protected admin routes with dashboard layout

#### Data Fetching
- Server Components for initial data loading
- Client Components with React Query for dynamic data
- Firebase Firestore as primary database

#### Styling Approach
- Tailwind CSS with custom configuration
- Dark mode support via `next-themes`
- Custom color palette defined in `tailwind.config.js`

#### State Management
- React Query for server state
- Context API for client state (Navigation, Language, Admin)
- Firebase for persistent data

## Firebase Configuration

### Collections Structure
- `hero` - Hero section content
- `about` - About page content
- `services` - Services offerings
- `testimonials` - Client testimonials  
- `blogs` - Blog posts
- `clients` - Client logos/info
- `faq` - Frequently asked questions
- `footer` - Footer content
- `header` - Header/navigation content
- `products` - Product catalog
- `contracts` - Contract management
- `customers` - Customer data
- `maintenances` - Maintenance records
- `checksheet-apar` - Fire extinguisher check sheets

### Security Rules
Currently set to allow all read/write (development mode) - should be restricted for production.

## Component Patterns

### Server/Client Component Split
Most components have a Server and Client version:
- `Server[Component]` - Fetches data server-side
- `Client[Component]` - Handles interactivity and client-side state
- Main component exports the appropriate version

Example:
```tsx
// components/Site/Hero/index.tsx
export { default } from "./ServerHero";
```

### Admin Components
Admin components typically include:
- Editor components for content management
- Preview components for live preview
- Collection management components

## Important Files

- `next.config.js` - Next.js configuration with Firebase transpilation
- `tailwind.config.js` - Custom Tailwind configuration
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Firestore security rules
- `next-sitemap.config.js` - Sitemap generation config

## Development Guidelines

### Path Aliases
Use `@/` for absolute imports from project root:
```tsx
import Component from "@/components/Component"
```

### TypeScript Configuration
- Strict null checks enabled
- No strict mode (be careful with type safety)
- JSX preserve mode for Next.js

### Performance Optimizations
- Image optimization with Next.js Image component
- Font optimization with Next.js font loading
- Standalone output mode for efficient deployments
- React Query for efficient data caching
- Lazy loading for non-critical components

### Environment Variables
Required environment variables for Firebase configuration:
- Firebase project credentials (check Firebase console)
- Google Analytics configuration (if enabled)

## Common Tasks

### Adding a New Admin Collection
1. Create type definition in `/types`
2. Add CRUD actions in `/actions`
3. Create admin components in `/components/Admin`
4. Add routes in `/app/(admin)/admin/[collection]`

### Modifying Site Content
1. Access admin dashboard at `/admin`
2. Navigate to appropriate collection
3. Use editor components to modify content
4. Changes reflect immediately on the public site

### Deploying Updates
1. Run `npm run build` to create production build
2. Test with `npm run start` locally
3. Deploy using preferred hosting (configured for standalone Next.js)