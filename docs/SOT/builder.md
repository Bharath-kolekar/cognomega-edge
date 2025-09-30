# Builder Service Documentation

## Overview

The Cognomega Builder is a real-time, AI-powered application generation interface that enables users to create full-stack applications through natural language descriptions and interactive configuration.

## Architecture

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Builder Frontend                           │
│                 (Cloudflare Pages)                             │
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │  LaunchInBuilder│  │  Voice Assistant│  │  Live Preview │ │
│  │   Component     │  │   Integration   │  │               │ │
│  └────────┬────────┘  └────────┬────────┘  └───────┬───────┘ │
│           │                    │                     │         │
│           └────────────────────┴─────────────────────┘         │
│                              │                                 │
└──────────────────────────────┼─────────────────────────────────┘
                               │ HTTP/WebSocket
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                      API Service                               │
│                  (Cloudflare Workers)                          │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         Multi-Agent System (si-core)                   │   │
│  │                                                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │   │
│  │  │FullStack     │→ │Project       │→ │UI Design    │ │   │
│  │  │Assistant     │  │Planning      │  │Agent        │ │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │   │
│  │         │                 │                  │        │   │
│  │         ▼                 ▼                  ▼        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │   │
│  │  │Frontend      │  │Backend       │  │Database     │ │   │
│  │  │Agent         │  │Agent         │  │Agent        │ │   │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### Component Location

**Primary Component**: `packages/frontend/src/components/LaunchInBuilder.tsx`

This is the main React component that powers the builder interface.

## Features

### 1. Natural Language Input

Users can describe their application in plain English:

```typescript
interface BuilderInput {
  name: string;           // Application name
  pages: string;          // Page structure (comma-separated)
  description: string;    // Detailed description
}
```

**Example Input**:
```
Name: Task Manager
Pages: Dashboard, Tasks, Settings
Description: A task management app with user authentication,
real-time updates, and task categorization.
```

### 2. Skill Selection

The builder offers configurable "skills" that customize the generation:

#### Available Skills

- **codegen_plus**: Enhanced code generation
- **generate_unit_tests**: Automatic unit test creation
- **generate_e2e_tests**: End-to-end test generation
- **security_scan**: Security vulnerability analysis
- **refactor_suggestions**: Code improvement recommendations
- **typed_api_clients**: TypeScript API client generation
- **i18n_scaffold**: Internationalization setup
- **analytics_wiring**: Analytics integration
- **performance_budget**: Performance optimization
- **docs_and_comments**: Documentation generation
- **error_boundaries**: React error boundary setup
- **playwright_specs**: Playwright test generation
- **rag_scaffold**: RAG (Retrieval-Augmented Generation) setup

**Default Configuration**:
```typescript
const defaultSkills = {
  codegen_plus: true,
  generate_unit_tests: true,
  generate_e2e_tests: false,
  security_scan: true,
  refactor_suggestions: true,
  typed_api_clients: true,
  i18n_scaffold: false,
  analytics_wiring: true,
  performance_budget: false,
  docs_and_comments: true,
  error_boundaries: true,
  playwright_specs: false,
  rag_scaffold: false,
};
```

### 3. Voice Assistant Integration

The builder integrates with Cognomega's voice assistant:

- Voice input for application description
- Voice commands for navigation
- Speech-to-text integration
- Voice feedback and guidance

**Voice Hints**: Each UI element includes voice hints for accessibility:
```tsx
data-voice-hint="Open the real-time App Builder. It generates apps from your description and pages."
```

### 4. Real-Time Generation

The builder communicates with the backend API to generate applications in real-time:

**API Endpoint**: `POST /api/sketch-to-app`

**Request Format**:
```typescript
interface SketchToAppRequest {
  email: string;
  name: string;
  pages: string[];
  description: string;
  skills: Record<string, boolean>;
}
```

**Response Format**:
```typescript
interface SketchToAppResponse {
  ok: boolean;
  slug?: string;          // Unique identifier
  contentUrl?: string;    // Builder URL with content
  error?: string;
}
```

### 5. Live Preview

Once generated, applications can be previewed directly in the builder:

**Builder URL Format**:
```
https://builder.cognomega.com/?slug={slug}
```

The slug is used to load the generated application plan and provide a live, editable interface.

## User Flow

### Step-by-Step Process

1. **Input Application Details**
   - Enter application name
   - Define page structure
   - Write detailed description

2. **Configure Skills**
   - Select desired features
   - Enable/disable specific capabilities
   - Review default selections

3. **Generate Application**
   - Click "Launch in Builder"
   - Backend processes request through multi-agent system
   - Slug generated and returned

4. **Open in Builder**
   - Redirect to builder interface
   - Load generated application plan
   - Begin editing and customizing

5. **Export/Deploy**
   - Download generated code
   - Deploy to Cloudflare/Vercel
   - Continue development locally

## Backend Integration

### Multi-Agent Processing

When a build request is submitted:

1. **FullStackAIAssistant** receives the request
2. **ProjectPlanningAgent** analyzes requirements
3. **UIDesignAgent** creates design system
4. **FrontendDevAgent** generates frontend code
5. **BackendDevAgent** generates API code
6. **DatabaseAgent** designs schema
7. **TestingAgent** creates test suites
8. **DevOpsAgent** sets up deployment

**Processing Time**: 10-60 seconds depending on complexity

### API Integration

**Primary Endpoints Used**:

- `POST /api/sketch-to-app` - Main generation endpoint
- `POST /api/agents/build` - Direct agent orchestration
- `POST /api/agents/plan` - Project planning
- `GET /api/agents/status` - Progress tracking

### Data Storage

Generated applications are stored in:

- **KV Namespace**: Metadata and slugs
- **R2 Bucket**: Generated code and assets
- **TTL**: 30 days by default

## Deployment

### Cloudflare Pages Configuration

**Repository**: Cognomega Edge monorepo  
**Build Command**: `pnpm run build`  
**Build Output**: `packages/frontend/dist`  
**Environment**: Production

### Environment Variables

Required variables for Pages deployment:

```env
VITE_API_BASE=https://api.cognomega.com
VITE_BUILDER_BASE=https://builder.cognomega.com
VITE_TURNSTILE_SITE_KEY={optional}
```

### Pages Functions

**Location**: `packages/frontend/functions/`

**Available Functions**:
- `auth/guest.ts` - Guest authentication endpoint

These run as Cloudflare Pages Functions alongside the static site.

### Custom Domain

**Domain**: `builder.cognomega.com`  
**DNS**: Managed by Cloudflare  
**SSL**: Automatic (Cloudflare Universal SSL)

### Deployment Pipeline

**Workflow**: `.github/workflows/deploy-builder.yml`

```yaml
name: Deploy Builder
on:
  push:
    branches: [main]
    paths:
      - "packages/frontend/**"
      - ".github/workflows/deploy-builder.yml"
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Install dependencies
        working-directory: packages/frontend
        run: pnpm install
      - name: Build
        working-directory: packages/frontend
        run: pnpm run build
      - name: Deploy to Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy packages/frontend/dist --project-name=cognomega-builder
```

**Triggers**:
- Push to `main` branch (when frontend files change)
- Manual workflow dispatch

**Deployment Time**: ~2-3 minutes

## UI/UX Design

### Design System

**Styling**: Tailwind CSS 4.x

**Key Components**:
- Glass morphism cards (`glass-card` class)
- Animated transitions
- Dark mode support
- Responsive design (mobile-first)

### Layout Structure

```tsx
<div className="glass-card">
  <header>
    <h2>Launch in Builder</h2>
    <span className="badge">AI-Powered</span>
  </header>
  
  <form>
    <input name="name" placeholder="App Name" />
    <input name="pages" placeholder="Page structure" />
    <textarea name="description" />
    
    <div className="skills-grid">
      {/* Skill checkboxes */}
    </div>
    
    <button type="submit">Launch in Builder</button>
  </form>
</div>
```

### Accessibility

- **ARIA labels** on all interactive elements
- **Voice hints** for voice assistant
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Focus management**

### Responsive Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

## Performance Optimization

### Code Splitting

Vite automatically splits code:
- Route-based splitting
- Dynamic imports for heavy components
- Vendor chunk optimization

### Asset Optimization

- **Images**: WebP format, lazy loading
- **Fonts**: Subset, preload
- **CSS**: Purged, minified
- **JavaScript**: Tree-shaken, minified

### Caching Strategy

```
Static Assets: Cache-Control: public, max-age=31536000
HTML: Cache-Control: public, max-age=0, must-revalidate
API Responses: No cache (dynamic)
```

### Performance Metrics

**Target Metrics**:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

**Actual Performance** (via Cloudflare CDN):
- FCP: ~0.8s
- LCP: ~1.2s
- TTI: ~2.1s
- CLS: ~0.05

## Error Handling

### User-Facing Errors

```typescript
interface BuildError {
  code: string;
  message: string;
  details?: unknown;
}
```

**Common Error Scenarios**:
- API timeout (>30s)
- Invalid input validation
- Credit insufficiency
- Rate limiting
- Backend unavailability

### Error Recovery

1. **Retry Logic**: Automatic retry for transient failures
2. **Fallback UI**: Graceful degradation
3. **User Feedback**: Clear error messages
4. **Support Contact**: Link to support for unrecoverable errors

## Testing

### Test Coverage

**Component Tests**: LaunchInBuilder.test.tsx
- Input validation
- Skill selection
- Form submission
- API integration (mocked)

**E2E Tests** (Playwright):
- Complete build flow
- Voice assistant integration
- Live preview navigation

### Manual Testing Checklist

- [ ] Application name input
- [ ] Page structure parsing
- [ ] Description textarea
- [ ] All skill toggles
- [ ] Form submission
- [ ] Loading states
- [ ] Error handling
- [ ] Success redirect
- [ ] Dark mode
- [ ] Mobile responsiveness
- [ ] Voice assistant
- [ ] Accessibility (screen reader)

## Security

### Authentication

- User email required (via header or JWT)
- Guest tokens supported
- JWT validation on backend

### Input Validation

- Maximum lengths enforced
- Special character sanitization
- XSS prevention (React escaping)
- SQL injection prevention (parameterized queries)

### Rate Limiting

- Per-user credit system
- IP-based rate limiting (Cloudflare)
- Abuse detection

### Content Security Policy

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.cognomega.com;
  img-src 'self' data: https:;
```

## Monitoring & Analytics

### Real User Monitoring

**Cloudflare Web Analytics**:
- Page views
- Performance metrics
- Geographic distribution
- Device types

### Custom Events

```typescript
// Track generation requests
analytics.track('builder.generate', {
  name: appName,
  pageCount: pages.length,
  skillCount: enabledSkills.length
});

// Track success/failure
analytics.track('builder.complete', {
  slug,
  duration: endTime - startTime
});
```

### Error Tracking

Integration with error tracking service (optional):
- Runtime errors
- API failures
- User feedback

## Future Enhancements

### Planned Features

1. **Real-time Collaboration**: Multiple users editing simultaneously
2. **Version Control**: Git integration for generated projects
3. **Template Library**: Pre-built application templates
4. **Component Marketplace**: Community-contributed components
5. **AI Chat Interface**: Conversational refinement
6. **Visual Editor**: Drag-and-drop UI builder
7. **Code Diff View**: See changes in real-time
8. **Deployment Integration**: One-click deploy to various platforms

### Technical Improvements

1. **WebSocket Support**: Real-time progress updates
2. **Incremental Generation**: Stream results as they're ready
3. **Caching Layer**: Faster repeated generations
4. **Offline Mode**: PWA with service worker
5. **Mobile App**: Native iOS/Android apps

## Troubleshooting

### Common Issues

**Issue**: "Generation taking too long"
- **Cause**: Complex project or high load
- **Solution**: Wait or simplify requirements

**Issue**: "Builder not loading"
- **Cause**: Invalid slug or expired content
- **Solution**: Regenerate from main app

**Issue**: "Skills not applied"
- **Cause**: Backend configuration
- **Solution**: Verify API deployment

### Debug Mode

Enable debug logging:
```typescript
localStorage.setItem('DEBUG_BUILDER', 'true');
```

View console for detailed logs.

---

*See also*:
- [Microservices & Agents](./microservices.md)
- [Development Workflow](./development-workflow.md)
- [CI/CD Pipeline](./ci-cd.md)
