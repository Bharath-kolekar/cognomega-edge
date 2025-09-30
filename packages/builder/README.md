# @cognomega/builder

Cognomega realtime app builder UI microservice - A standalone React application for building applications in real-time with live preview.

## Overview

This microservice provides the interactive builder interface where users can:
- Create applications with real-time preview
- Design UI components interactively
- Generate code on-the-fly
- Export complete application packages

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript with strict mode

## Development

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.17.1

### Install Dependencies

From the monorepo root:
```powershell
pnpm install
```

Or from this package:
```powershell
cd packages/builder
pnpm install
```

### Run Development Server

From the monorepo root:
```powershell
pnpm -C packages/builder dev
```

Or using the root script:
```powershell
pnpm dev:builder
```

The builder will be available at `http://localhost:5175`

### Build for Production

```powershell
pnpm -C packages/builder build
```

### Type Checking

```powershell
pnpm -C packages/builder typecheck
```

## Architecture

This microservice is designed to operate independently while integrating with other Cognomega services:

- **Standalone Development**: Can be developed and tested without other services
- **Independent Deployment**: Can be deployed separately to static hosting (e.g., Cloudflare Pages)
- **API Integration**: Connects to the API service for backend functionality
- **Type Safety**: Uses TypeScript project references for shared types

## Port Configuration

- **Development**: Port 5175
- **Preview**: Port 5175

These ports are distinct from other services to avoid conflicts:
- Frontend: Port 5174
- Builder: Port 5175

## Project Structure

```
packages/builder/
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utilities and helpers
│   ├── styles/        # CSS and style files
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
├── public/            # Static assets
├── index.html         # HTML template
├── package.json       # Package configuration
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite build configuration
└── README.md          # This file
```

## Integration Points

### API Service
- Connects to API endpoints for application generation
- Uses REST API for real-time operations

### SI-Core Library
- Can import shared types and utilities
- Maintains type safety across the monorepo

## Environment Variables

Create a `.env` file in this directory for local development:

```env
VITE_API_URL=http://localhost:8787
```

## Deployment

This microservice can be deployed independently:

1. **Build**: `pnpm build`
2. **Deploy**: Upload `dist/` folder to static hosting
3. **Configure**: Set environment variables in hosting platform

Recommended platforms:
- Cloudflare Pages
- Vercel
- Netlify

## Contributing

When making changes to this microservice:

1. Maintain backward compatibility with API contracts
2. Update types in si-core if shared interfaces change
3. Run type checking before committing: `pnpm typecheck`
4. Test locally with development server
5. Ensure builds succeed before creating PR

## Notes

- This package uses `composite: true` in tsconfig.json for TypeScript project references
- Maintains strict TypeScript configuration for type safety
- Uses Vite for fast development and optimized production builds
- Independent from the main frontend package but shares design principles
