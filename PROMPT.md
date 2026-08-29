# CrewKit Specification & Prompt History

This document records the master prompts, development chunks, version milestones, and repository conventions for **CrewKit** — a Progressive Web App (PWA) built for Singapore Airlines cabin crew.

---

## Version & Chunk History

| Chunk | Branch | Target Version | Focus Area | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Chunk 1** | `arena/01a04e46-crewkit` | `v0.1.0` | Project Scaffold — Hollow shell, PWA setup, single-viewport layouts, navigation, theme toggle | Completed |
| **Chunk 2** | `arena/01a04e46-crewkit` | `v0.2.0` | Functional Build — CrewCash round-trip sector calculator, SkyMenu cabin detection/menu viewer, InkFlight thermal receipt formatter & PNG/DOCX/PDF exports | Completed |
| **Chunk 3** | `arena/01a04e46-crewkit` | `v0.3.0` | CrewCash Allowance Math — Full seniority & station meal rate calculation engine | Planned |
| **Chunk 4** | `arena/01a04e46-crewkit` | `v1.0.0` | Settings & Offline Sync — Custom rates editor, JSON sync, full production release | Planned |

---

## Conventions & Workflow Rules

### Versioning (SemVer)
- Semantic Versioning format `MAJOR.MINOR.PATCH` (e.g. `0.2.0`).
- The current version is defined in `src/config/version.ts` and `package.json`.
- The version number is displayed in the hamburger dropdown menu footer.

### Branch & Deployment Strategy
- **Session Branch Rule:** All chunk commits and pushes are made directly to the active session branch `arena/01a04e46-crewkit`.
- **Vercel Preview URL:** Pushing to `arena/01a04e46-crewkit` triggers automated preview builds on Vercel for visual verification and testing.
- **Manual Main Merge:** Once the Vercel preview deployment for a chunk is approved by the user, the branch is manually merged into `main` before starting the next chunk.

### Architecture & UI Rules
- **Single-Viewport Only:** All pages must fit strictly within `100dvh` / `100vh` without scrolling (content inside SkyMenu & InkFlight results scrolls inside fixed shells).
- **Client-Side Only:** No backend; full offline capability via Service Worker.
- **Quiet Luxury Design System:** Deep near-black navy base (`#070B14`), champagne gold signal accents (`#C9A84C`), Playfair Display serif display headings, and Inter sans body text.

---

## Chunk 2 Prompt: Functional Build

```
=== CREWKIT — FUNCTIONAL BUILD ===

Implement the working logic for the three feature pages: CrewCash, SkyMenu, InkFlight.
All three consume the public Singapore Airlines inflight endpoints (menu page + /getcabin feed) client-side. No backend. No auth.
Keep the existing design system (deep navy #070B14, champagne gold #C9A84C, Playfair serif headlines, Inter UI, glass menu, single-viewport, no scroll).

=== GLOBAL SHARED PATTERNS ===
- Flight number input (Pattern A): Debounced validation, SQ badge, digits only.
- Departure date block (Pattern B): 3 pills (Today / Tomorrow / Pick date).
- Progression CTA (Pattern C): Centered gold gradient pill with summary line.
- Full-screen fetch transition (Pattern D): Gold ring loader + halo + fixed micro-copy timer sequence (8s for CrewCash, 5s for SkyMenu/InkFlight).

=== FEATURE 1 — CREWCASH ===
- Outbound & Inbound sector timings calculator with 8s timed fetch sequence.

=== FEATURE 2 — SKYMENU ===
- Dynamic aircraft & cabin detection with spring pills, 5s fetch interlude, dining & drinks courses.

=== FEATURE 3 — INKFLIGHT ===
- Thermal receipt formatter with live editor, 58mm/80mm width toggle, compact mode, and PNG/DOCX/PDF exports.
```

---

## Future Chunks

*(Future chunk prompts and design specifications will be appended in this section as development progresses.)*
