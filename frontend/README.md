# Technova 2025 – Networking Frontend

Frontend (React + TypeScript + Vite) for a networking platform empowering women and other underrepresented groups in male‑dominated spaces (gaming, tech conventions, sports).

## Goals
* Inclusive onboarding that captures goals, focus areas, and experience level.
* Profile pages highlighting areas of focus, experience, bio, and goals.
* Explore page to browse potential connections & events (placeholder data for now).
* Lightweight state management (Zustand) before wiring a backend.

## Stack
* React 18 + TypeScript
* Vite for fast dev/build
* React Router v6
* Zustand for user state
* Testing: Vitest + Testing Library

## Getting Started
Install dependencies:
```bash
npm install
```
Run dev server:
```bash
npm run dev
```
Run tests:
```bash
npm test
```
Build production bundle:
```bash
npm run build && npm run preview
```

## Key Directories
```
src/
	pages/          # Route pages (Home, Onboarding, Profile, Explore, Settings)
	components/     # Reusable UI pieces (ProfileCard, etc.)
	store/          # Zustand store for user session/profile
	utils/          # Helpers (e.g., username generator)
```

## Next Steps (Roadmap)
1. Auth integration (email / magic link or OAuth) – backend TBD.
2. Persistent storage (localStorage sync, then API).
3. Connection requests & messaging MVP.
4. Event entities & attendance matching.
5. Accessibility audit (focus order, ARIA labels, color contrast refinement).
6. Theming & light mode.
7. Analytics consent & privacy settings.

## Accessibility & Inclusion Notes
* High-contrast dark palette; ensure WCAG AA contrast is preserved if adjusting colors.
* Avoid gendered language in UI copy; focus on empowerment & community.
* Plan to support screen readers and keyboard-only navigation in upcoming iterations.

## Contributing
Open an issue with proposed feature or improvement. Keep PRs scoped & include screenshots for UI changes.

## Dev Handoff (Single UI: Chat demo integrated)
What you have
- Backend: Express + Socket.IO on port 3000 (in-memory chat store).
- Frontend (this app at frontend/): Vite on 5173. Chat page at /chat with:
  - Start Demo DM (creates a temp conversation).
  - Join Shared Demo Room (multi-user shared conversation).
- No separate root UI. All features run in this single frontend app.

Key notes
- CORS: Backend allows the frontend origin (http://localhost:5173) via FRONTEND_ORIGIN; Socket.IO CORS aligned.
- Chat API:
  - POST/GET /api/chat/rooms/shared upserts/joins a shared room.
  - conversation:join accepts { conversationId, userId } and auto-enrolls.
- Frontend:
  - store/chat.ts: socket handlers, REST loaders, join emits userId.
  - pages/Chat.tsx: Join Shared Demo Room with POST→GET fallback.
- Env: frontend/.env.local -> VITE_API_BASE=http://localhost:3000.

How to run
- Backend:
  cd backend && npm run dev
- Frontend:
  cd frontend && npm run dev
- Open http://localhost:5173/chat

Troubleshooting
- Start backend and set VITE_API_BASE to 3000 to avoid ERR_CONNECTION_REFUSED.
- CORS: ensure http://localhost:5173 is allowed by backend.
- Socket.IO connects directly to backend on 3000 (or via API base if proxied).
- Ports busy: stop other processes or align on a team-wide port.
- Verify backend: curl http://localhost:3000/ and /health/db.

If you see another UI
- You may be running a root app on 5174 or viewing a /dev portal. Use only http://localhost:5173/chat.
- Ensure you’re in the frontend folder when starting the UI.

## Consistent dev setup (single UI)

To ensure everyone sees the same UI against the same backend:

1) Run the same app
- Backend:
  cd backend && npm run dev
- Frontend:
  cd frontend && npm run dev

2) Ports
- Backend: 3000
- Frontend: 5173
- If a port is busy, stop the other process or pick a new shared port and update configs consistently.

3) Point the UI at the same API
- frontend/.env.local -> VITE_API_BASE=http://localhost:3000

4) Quick verification
- Frontend: http://localhost:5173/chat
- Backend: curl http://localhost:3000/ -> "API is running"

Signs you're on a different app
- Different routes/nav (e.g., /ai-demo or a different layout).
- Different dev ports (5174 or others) or different API base (8787 vs 3000).

## Backend MongoDB integration: quick verification

Note: This checks the backend API’s MongoDB connection. Run these from the backend directory.

1) Find the DB connect code:
```bash
cd backend
grep -R -n -E "mongoose|MongoClient|MONGODB_URI" .
# alternatives
grep -R -n -i "mongo" .
```
Expect to see something like:
- `mongoose.connect(process.env.MONGODB_URI)`
- or `new MongoClient(process.env.MONGODB_URI)`

2) Ensure backend/.env has MONGODB_URI set:
```bash
# Atlas example
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"
```

3) Run the backend and look for a “connected to MongoDB” log:
```bash
cd backend
npm run dev
```

4) Health check (route is already implemented at /health/db):
```bash
curl http://localhost:3000/health/db
# -> { "ok": true, "driver": "mongoose", "state": 1, "db": "technova", "ping": 1 }
```

5) One-liner verification script (if present):
```bash
cd backend
node ./scripts/verify-backend.mjs
```

If `ok: true`, your MongoDB integration is live from the API’s perspective.

Troubleshooting tips:
- `state: 2` means connecting; wait/retry.
- `state: 0` (disconnected): check MONGODB_URI, network, or auth.
- If using Atlas, ensure IP is whitelisted and SRV DNS works.

---
© 2025 Technova Networking
# technova-2025