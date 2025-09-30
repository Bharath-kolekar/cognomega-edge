# @cognomega/frontend

Cognomega Frontend UI microservice - The main application interface providing the primary user experience for the Cognomega platform.

## Overview

This microservice provides the main application UI:
- Full-featured application builder interface
- AI-powered development tools
- Real-time collaboration features
- Multi-modal interaction (text, voice)
- Project management and deployment

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **AI**: MLC AI Web LLM for client-side inference
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

### Run Development Server

From the monorepo root:
```powershell
pnpm -C packages/frontend dev
```

Or using the root script:
```powershell
pnpm dev:frontend
```

The frontend will be available at `http://localhost:5174`

### Build for Production

```powershell
pnpm -C packages/frontend build
```

### Type Checking

```powershell
pnpm -C packages/frontend typecheck
```

## Architecture

This microservice is designed to operate independently:

- **Standalone Development**: Can be developed and tested without backend
- **Independent Deployment**: Can be deployed to Cloudflare Pages
- **API Integration**: Connects to API service for backend functionality
- **Type Safety**: Uses TypeScript project references with si-core

## Port Configuration

- **Development**: Port 5174
- **Preview**: Port 5174

Distinct from other services:
- Frontend: Port 5174
- Builder: Port 5175
- API: Port 8787

## Project Structure

```
packages/frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and helpers
│   ├── types/         # TypeScript types
│   ├── App.tsx        # Main application
│   └── main.tsx       # Entry point
├── public/            # Static assets
├── functions/         # Cloudflare Pages Functions
├── legacy/            # Legacy code (v0 import)
├── package.json       # Package configuration
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite build configuration
└── README.md          # This file
```

## Integration Points

### API Service
- REST API for backend operations
- WebSocket for real-time features
- Authentication and authorization

### SI-Core Library
- Shared intelligence types
- AI model interfaces
- Utility functions

### Builder Service
- Can embed or link to builder
- Shared design system
- Consistent UX patterns

## Environment Variables

Create a `.env` file in this directory:

```env
VITE_API_URL=http://localhost:8787
VITE_WS_URL=ws://localhost:8787
```

## Features

### Core Capabilities
- **Project Management**: Create, edit, deploy projects
- **AI Assistant**: Integrated AI chat and code generation
- **Voice Interface**: Voice commands and navigation
- **Real-time Preview**: Live application preview
- **Collaboration**: Multi-user editing (if enabled)

### UI Components
- Modern, accessible component library
- Dark/light theme support
- Responsive design
- Touch-friendly interface

## Deployment

This microservice can be deployed independently:

1. **Build**: `pnpm build`
2. **Deploy**: Upload `dist/` folder to Cloudflare Pages
3. **Configure**: Set environment variables

Deployment platforms:
- Cloudflare Pages (recommended)
- Vercel
- Netlify

## Contributing

When making changes to this microservice:

1. Maintain backward compatibility
2. Update shared types in si-core if needed
3. Run type checking: `pnpm typecheck`
4. Test locally with dev server
5. Ensure builds succeed before PR
6. Update documentation for new features

## Notes

- Uses `composite: true` in tsconfig.json for project references
- Depends on `@cognomega/si-core` for shared types
- Configured with strict TypeScript
- Large AI model bundle (~2MB gzipped) - consider code splitting
- Uses workspace protocol for internal dependencies
