# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Package Manager
- Uses `pnpm` as the package manager (see packageManager in package.json)
- Install dependencies: `pnpm install`

### Development
- Start development server: `pnpm dev` (uses Next.js with Turbo)
- Start Storybook: `pnpm storybook` (runs on port 6006)

### Building
- Build application: `pnpm build`
- Build and preview: `pnpm preview`
- Build Storybook: `pnpm build-storybook`

### Code Quality
- Lint code: `pnpm lint` (uses Next.js ESLint config)
- Fix linting issues: `pnpm lint:fix`
- Type check: `pnpm typecheck` (runs TypeScript compiler without emit)
- Combined check (lint + typecheck): `pnpm check`
- Format code: `pnpm format:write` (uses Prettier)
- Check formatting: `pnpm format:check`

### Testing
- Run tests: `vitest` (configured in vitest.config.ts)
- Run specific test: `vitest path/to/test.test.ts`
- Test coverage: `vitest --coverage`
- Tests located in: `src/**/*.test.{ts,tsx}`
- Test setup: `.storybook/vitest.setup.ts`

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.5+
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: tRPC with TanStack Query
- **Authentication**: NextAuth.js with Clerk integration
- **Search**: Typesense InstantSearch integration
- **Testing**: Vitest with jsdom environment
- **Documentation**: Storybook 8

### Core Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (includes shadcn/ui in `ui/` subfolder)
- `src/server/` - Server-side code including tRPC API and auth
- `src/lib/` - Utility functions and configurations
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks
- `src/trpc/` - tRPC client configuration

### Key Features

#### Typesense Search Integration
- **Configuration**: `src/lib/typesense.ts` - Dual adapter setup (primary and secondary)
- **Types**: `src/types/typesense.ts` - Complete ProfileHit interfaces matching backend schema
- **Components**: Profile search with InstantSearch UI components
- **Environment Setup**: Comprehensive Typesense environment variable configuration
- **Vector Search**: Supports both text and embedding-based search with 768-dimension vectors

#### Component Architecture
- **UI Components**: Built on Radix UI primitives with shadcn/ui styling
- **Specialized Components**: AudioWave visualization, shader components, voice chat integration
- **Search Components**: ProfileSearch, ProfileHit, and demo components for Typesense
- **3D Components**: React Three Fiber integration for shader visualizations

#### Server Architecture
- **tRPC**: Type-safe API with public and protected procedures
- **Authentication**: NextAuth.js with session management
- **Middleware**: Timing middleware with artificial dev delays for testing

### Environment Configuration
Required environment variables (see TYPESENSE_ENV_SETUP.md for details):
- `NEXT_PUBLIC_TYPESENSE_*` - Typesense server configuration (supports dual setup with *2 variants)
- `AUTH_SECRET` - NextAuth secret
- `GROQ_API_KEY` - For AI/LLM integration
- Environment validation via `@t3-oss/env-nextjs` in `src/env.js`

### Development Workflow
1. **Schema-First Development**: Typesense schema definitions drive both backend and frontend types
2. **Component Development**: Use Storybook for isolated component development
3. **Type Safety**: Strict TypeScript configuration with tRPC ensuring end-to-end type safety
4. **Code Quality**: Automated linting, formatting, and type checking before commits

### Testing Strategy
- **Unit Tests**: Vitest with React Testing Library
- **Component Testing**: Storybook with interaction tests
- **Type Safety**: TypeScript compiler checks during development

### Special Considerations
- **Dual Typesense Setup**: Primary and secondary adapters for different configurations
- **Vector Search**: Full support for embedding-based search with proper type definitions
- **Shader Integration**: Custom WebGL shader components using React Three Fiber
- **Voice Integration**: Voice recording and chat functionality
- **Performance**: Implements caching strategies for search results (2-minute TTL)

### File Naming Conventions
- Components: PascalCase (e.g., `ProfileSearch.tsx`)
- Utilities: camelCase (e.g., `typesense.ts`)
- Types: camelCase with descriptive names (e.g., `typesense.ts`)
- Pages: Next.js App Router conventions (`page.tsx`, `layout.tsx`)

### Known Dependencies
- Uses pnpm workspaces (see pnpm-workspace.yaml)
- Node.js >= 20.11.0 required
- Integrates with external services: Typesense, Clerk, Groq
- Supports deployment on Vercel with custom configuration

### Important Files for Setup
- `TYPESENSE_SETUP.md` - Basic Typesense integration guide
- `TYPESENSE_ENV_SETUP.md` - Environment variable configuration
- `TYPESENSE_ADVANCED.md` - Advanced features including multisearch
- `BACKEND_SCHEMA_UPDATE.md` - Backend schema update procedures
- `scrapers/` - Python scrapers for data collection (Pipfile managed)