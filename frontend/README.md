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

## MongoDB integration: quick verification

1) Find the DB connect code:
```bash
# from repo root
grep -R -n -E "mongoose|MongoClient|MONGODB_URI" .
# alternatives
grep -R -n -i "mongo" .
```
Expect to see something like:
- `mongoose.connect(process.env.MONGODB_URI)`
- or `new MongoClient(process.env.MONGODB_URI)`

2) Ensure MONGODB_URI is set:
```bash
# Atlas example
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority"
```

3) Run the backend and look for a “connected to MongoDB” log:
```bash
npm run dev   # or your backend start script
```

4) Health check (after adding the route below):
```bash
curl http://localhost:3000/health/db
# -> { "ok": true, "driver": "mongoose", "state": 1, "db": "technova", "ping": 1 }
```

5) One-liner verification script:
```bash
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

commit test