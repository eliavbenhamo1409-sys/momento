# Momento — AI Photo Album Creator

A premium web application that creates beautiful photo albums using AI. Users upload photos, answer preference questions, and the AI designs a complete print-ready album.

## Tech Stack

- **React 19** + TypeScript
- **Vite** for builds
- **Tailwind CSS v4** for styling
- **Motion** (Framer Motion v12) for animations
- **Zustand v5** for state management
- **React Router v7** for SPA routing

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Screens

| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Landing Page | Scrollable homepage with hero, how it works, examples, pricing, FAQ |
| `/upload` | Upload | Drag-and-drop photo upload with progress |
| `/setup` | Setup | Paginated AI preference questions with live preview |
| `/generating` | Generation | Animated AI processing with 5 stages |
| `/editor` | Editor | Full album editor with canvas, sidebar, page thumbnails |
| `/checkout` | Checkout | Order summary and payment form |
| `/confirmation` | Confirmation | Order success screen |

## Architecture

- **RTL-first** — Hebrew interface with `dir="rtl"`
- **No-scroll product screens** — All screens except landing page fit in a single viewport
- **SPA transitions** — Animated route transitions via AnimatePresence
- **Mock data** — All flows use simulated data; ready for backend integration
