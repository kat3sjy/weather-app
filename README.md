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

---
© 2025 Technova Networking
# technova-2025

commit test