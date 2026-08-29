# CrewKit Specification & Prompt History

This document records the master prompts, development chunks, version milestones, and repository conventions for **CrewKit** — a Progressive Web App (PWA) built for Singapore Airlines cabin crew.

---

## Version & Chunk History

| Chunk | Branch | Target Version | Focus Area | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Chunk 1** | `arena/01a04e46-crewkit` | `v0.2.0` | Project Scaffold — Hollow shell, PWA setup, 3-card home grid, unified settings, dark/light mode, logo design | Completed |
| **Chunk 2** | `arena/01a04e46-crewkit` | `v0.3.0` | CrewCash — Allowance calculations, sector routing, per diem database | Planned |
| **Chunk 3** | `arena/01a04e46-crewkit` | `v0.4.0` | SkyMenu — Menu scraper / data parser, cabin class courses | Planned |
| **Chunk 4** | `arena/01a04e46-crewkit` | `v0.5.0` | InkFlight — Thermal slip formatter engine, custom layouts, PDF/DOCX export | Planned |
| **Chunk 5** | `arena/01a04e46-crewkit` | `v1.0.0` | Rates customizer, offline sync, PWA production release | Planned |

---

## Conventions & Workflow Rules (Updated)

### Versioning (SemVer)
- Semantic Versioning format `MAJOR.MINOR.PATCH` (e.g. `0.2.0`).
- The current version is defined in `src/config/version.ts` and `package.json`.
- The version number is displayed in the hamburger dropdown menu footer.

### Branch & Deployment Strategy
- **Session Branch Rule:** All chunk commits and pushes are made directly to the active session branch `arena/01a04e46-crewkit`.
- **Vercel Preview URL:** Pushing to `arena/01a04e46-crewkit` triggers automated preview builds on Vercel for visual verification and testing.
- **Manual Main Merge:** Once the Vercel preview deployment for a chunk is approved by the user, the branch is manually merged into `main` before starting the next chunk.

### Architecture & UI Rules
- **Single-Viewport Only:** All pages must fit strictly within `100dvh` / `100vh` without scrolling.
- **Client-Side Only:** No backend; full offline capability via Service Worker.
- **Quiet Luxury Design System:** Deep near-black navy base (`#070B14`), champagne gold signal accents (`#C9A84C`), Playfair Display serif display headings, and Inter sans body text.

### Brand Identity & Logo
- **Mark:** Rounded square (`radius: 24%`), fill `#0B1E3E`, champagne-gold geometric abstract paper plane (`#C9A84C`) with slight ascent to top-right.
- **Wordmark:** `Inter SemiBold` — "Crew" in `--text-primary`, "Kit" in `--accent` gold. (No serif in logo).
- **Nav Lockup:** `[mark 28px] [10px gap] [wordmark]` top-left only.
- **Strict Brand Constraints:** Do NOT use SQ branding, realistic planes, gradients on the icon, or Playfair in the logo.

---

## Chunk 1 Prompts

### Initial Scaffold & Design System
```
You are building a Progressive Web App (PWA) called "CrewKit" — a toolkit for Singapore Airlines cabin crew. This is Chunk 1: Project Scaffold. The goal is to create a fully navigable hollow shell with no working logic — just pages, navigation, and PWA installability.
```

### UI Refinement & Deduping
```
=== 1. HOME PAGE (/) — RESTRUCTURE ===
- Remove: Settings card from grid, corner arrows, Singapore Airlines eyebrow.
- Hero: Eyebrow "Cabin crew toolkit", Headline "Your cabin crew companion." (companion. in italic gold), Subcopy "Refined tools for allowances, dining, and print prep."
- 3 cards in grid (CrewCash, SkyMenu, InkFlight) with gold glyph icons (Calculator, UtensilsCrossed, Printer).

=== 2. SETTINGS PAGE (/settings) — DEDUPE & SIMPLIFY ===
- Remove duplicate top pill tab row.
- Single tab control under headline (Theme / Rates / Data / About).
- Elevated card container per tab.

=== 3. HAMBURGER MENU — UPGRADES ===
- Full row theme toggle with mini segmented switch.
- Standalone-aware install row.
- Feedback link.
- Footer: CrewKit v0.2.0 · For Crew.
```

---

## Future Chunks

*(Future chunk prompts and design specifications will be appended in this section as development progresses.)*
