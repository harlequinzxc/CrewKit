# CrewKit — Singapore Airlines Cabin Crew Progressive Web App (PWA)

> **Current Version:** `v0.2.0`  
> **Status:** Fully Functional PWA — CrewCash round-trip sector calculator, SkyMenu inflight dining viewer, and InkFlight thermal receipt homework formatter with live PNG/DOCX/PDF exports.  
> **Active Working Branch:** `arena/01a04e46-crewkit`

---

## Brand Identity & Logo Specification

- **Mark:** Rounded square (`radius: 24%`), filled with `#0B1E3E` (deep navy), containing a champagne-gold geometric abstract paper plane (`#C9A84C`) with slight ascent to the top-right.
- **Wordmark:** `Inter SemiBold` — "Crew" in `--text-primary`, "Kit" in `--accent` gold. (No serif in logo).
- **Nav Lockup:** `[mark 28px] [10px gap] [wordmark]` positioned in the top-left header across all pages.
- **PWA Icons & Favicon:** 192×192 &amp; 512×512 PNG icons (including 80% safe-zone maskable variants), SVG vector favicon, and `.ico` generated with exact geometry.

---

## Core Features & Working Logic

1. **CrewCash (`/crewcash`) — Round-Trip Sector Calculator**
   - **Outbound &amp; Inbound Wizard Flow:** Flight number validation (Pattern A), departure date block with quick presets (Pattern B), and progression CTA (Pattern C).
   - **8-Second Timed Fetch Interlude:** Fixed 4-step micro-copy rotation (*"Checking flight time with Tech Crew…"* &rarr; *"Checking arrival time…"* &rarr; *"Checking departure time…"* &rarr; *"Almost ready…"*) enforcing minimum duration even on cache hits.
   - **Sector Timings Display:** Sector duration block times, local departure and arrival times/dates per station, with multi-sector breakdown support (e.g., `SQ12 SIN → NRT → LAX`).

2. **SkyMenu (`/skymenu`) — Inflight Menu &amp; Wine Viewer**
   - **Dynamic Aircraft &amp; Cabin Detection:** Fetches `/getcabin` feed on flight/date selection with inline skeleton animation, rendering spring-animated cabin pills (*Suites, First, Business, Premium Economy, Economy*).
   - **5-Second Timed Fetch Interlude:** 2-step micro-copy rotation (*"Retrieving menu from seat pocket…"* &rarr; *"Almost ready…"*) enforcing minimum duration.
   - **Dining &amp; Drinks Viewer:** Categorized collapsible courses (*Appetisers, Mains, Desserts, Fine Wines, Cocktails, TWG Teas, Illy Specialty Coffee*) with catering thumbnails and dietary tags.
   - **Direct Handoff:** Seamless "Reformat for print &rarr;" bridge to InkFlight with flight parameters pre-filled.

3. **InkFlight (`/inkflight`) — Thermal Slip Print Formatter**
   - **Split Workspace:** Responsive layout featuring live Editor panel alongside a pure black-and-white thermal receipt canvas.
   - **Interactive Formatting Engine:** Section reordering with grip controls, inline visibility toggles (eye icons) for sections and items, compact mode, and thermal paper width switching (`58mm` / `80mm`).
   - **Multi-Format Export Engine:**
     - **PNG:** 2× DPR high-resolution canvas snapshot with Web Share / download trigger.
     - **PDF:** Formatted thermal receipt PDF sized dynamically to paper width.
     - **DOCX:** Structured Microsoft Word document generation via `docx` library.

4. **Settings (`/settings`)**
   - **Appearance:** Fully functional Dark Mode (near-black navy `#070B14`) and Light Mode (warm paper `#F5F2EB`) with persistent storage.
   - **Rates &amp; Modifiers:** Customizable station meal rates and seniority multipliers.
   - **Data Management:** JSON settings export and import tools.
   - **About:** System architecture and version diagnostics.

---

## Data Layer & Stateless Architecture

- **`src/lib/sq/endpoints.ts`:** Client-side query engine with intelligent Singapore Airlines flight schedule database, cabin configuration resolver, and rich inflight menu generator.
- **`src/lib/sq/cache.ts`:** LocalStorage caching with 24-hour TTL for cabin configs/menus and 1-hour TTL for schedules.
- **`src/lib/sq/config.ts`:** Configurable proxy base URL for CORS pass-through when deployed.

---

## Design System & Principles

- **Single Viewport, Zero Scrolling:** Every page is structured with flexbox/grid containers locked to `100dvh` / `100vh` (`overflow-hidden`), guaranteeing zero accidental scrolling on iOS, Android, or desktop.
- **Editorial Typography:** Google Fonts *Playfair Display* for elegant display headings and *Inter* for crisp, high-legibility UI labels.
- **Color Palette (CSS Variables):**
  - **Dark Mode (Default):** Deep near-black navy (`#070B14`), card surface (`#121826`), recessed wells (`#161E30`), champagne gold accents (`#C9A84C`), soft gold highlights (`#E8D5A3`), and ivory text (`#F0ECE4`).
  - **Light Mode:** Warm paper (`#F5F2EB`), white surface (`#FFFFFF`), warm recessed wells (`#EAE5D9`), deep navy text (`#0B1E3E`), and rich gold accent (`#A88B2E`).
- **Pill CTAs & Touch Targets:** All interactive elements feature minimum 44×44px hit targets with subtle tactile feedback (`scale(0.98)` on active press).

---

## Development & Deployment Workflow

- **Arena Session Branch:** All chunk developments, commits, and pushes are made directly to the active session branch `arena/01a04e46-crewkit`.
- **Vercel Preview URL:** Pushing to `arena/01a04e46-crewkit` triggers automated preview builds on Vercel for testing and visual QA.
- **Merge to Main:** After verifying the Vercel preview deployment for the completed chunk, changes are manually merged into `main` before progressing to subsequent chunks.

---

## How to Install as a PWA

### iOS (Safari)
1. Open the CrewKit URL in **Safari**.
2. Tap the **Share** button (box with an upward arrow) in the bottom toolbar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm the name "CrewKit" and tap **Add**. The app will launch in standalone full-screen mode without browser chrome.

### Android (Chrome)
1. Open the CrewKit URL in **Google Chrome**.
2. Tap the three-dot menu icon in the upper right.
3. Select **"Install App"** or **"Add to Home screen"**.
4. Follow the prompt to install the standalone PWA to your home screen or app drawer.
