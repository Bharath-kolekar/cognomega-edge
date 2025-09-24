# Cognomega — Product & UI/UX

This app ships a **glass/aurora** aesthetic with **AA contrast**, accessible focus states, and motion that respects the user’s **reduced-motion** setting.

### UX Standards (Fortune-50 ready)
- **Accessibility**: WCAG 2.2 AA contrast, focus-visible rings, keyboard-navigable controls, semantic headings/landmarks.
- **Performance**: ~50KB gzipped theme overhead cap. Avoid layout thrash; defer non-critical JS; prefer CSS effects.
- **Motion**: Sub-200ms micro-interactions; disable when `prefers-reduced-motion: reduce`.
- **Consistency**: Centralized tokens in `frontend/src/styles/ui.css`.
- **Dark/Light**: Uses system color scheme automatically.

### Theming
- Page background: `<body class="aurora-bg">`
- Glass cards: `glass-card` / `glass-surface-soft`
- Buttons: `btn-base btn-primary|btn-secondary|btn-ghost`
- Info/Error bubbles: `<div class="message-bubble" data-tone="info|error">…</div>`

### Screens updated
- **Realtime Builder panel** (`LaunchInBuilder.tsx`)
- **Usage Feed** (`UsageFeed.tsx`)

