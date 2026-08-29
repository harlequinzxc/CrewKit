# CrewKit Specification & Prompt History

This document records the master prompts, development chunks, version milestones, and repository conventions for **CrewKit** — a Progressive Web App (PWA) built for Singapore Airlines cabin crew.

---

## Version & Chunk History

| Chunk | Branch | Target Version | Focus Area | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Chunk 1** | `chunk-1` | `v0.1.0` | Project Scaffold — Hollow shell, PWA setup, all pages, navigation, settings, dark/light mode | Completed |
| **Chunk 2** | `chunk-2` | `v0.2.0` | CrewCash — Allowance calculations, sector routing, per diem database | Planned |
| **Chunk 3** | `chunk-3` | `v0.3.0` | SkyMenu — Menu scraper / data parser, cabin class courses | Planned |
| **Chunk 4** | `chunk-4` | `v0.4.0` | InkFlight — Thermal slip formatter engine, custom layouts, PDF/DOCX export | Planned |
| **Chunk 5** | `chunk-5` | `v1.0.0` | Rates customizer, offline sync, PWA production release | Planned |

---

## Conventions & Rules

### Versioning (SemVer)
- Semantic Versioning format `MAJOR.MINOR.PATCH` (e.g. `0.1.0`).
- The current version is defined in `src/config/version.ts` and `package.json`.
- The version number is displayed subtly on every page in the layout footer.

### Branch Naming
- Each discrete development chunk corresponds to a local branch named `chunk-X` (e.g., `chunk-1`, `chunk-2`).

### Commit Message Format
- Structured as: `chunk-X: <short summary> (vX.Y.Z)`
- Example: `chunk-1: project scaffold — hollow shell with PWA setup, all pages, navigation, settings page, dark/light mode (v0.1.0)`

### Architecture & UI Rules
- **Single-Viewport Only:** All pages must fit strictly within `100dvh` / `100vh` without scrolling.
- **Client-Side Only:** No backend; full offline capability via Service Worker.
- **Quiet Luxury Design System:** Deep near-black navy base (`#070B14`), champagne gold signal accents (`#C9A84C`), Playfair Display serif display headings, and Inter sans body text.

---

## Chunk 1 Prompt

```
You are building a Progressive Web App (PWA) called "CrewKit" — a toolkit for Singapore Airlines cabin crew. This is Chunk 1: Project Scaffold. The goal is to create a fully navigable hollow shell with no working logic — just pages, navigation, and PWA installability.

=== CRITICAL CONSTRAINTS ===
- DO NOT use Flutter or Dart. There is no Flutter/Dart toolchain in this sandbox.
- Use React + TypeScript + Vite + Tailwind CSS.
- The app MUST be a PWA installable from a mobile browser (include manifest.json, service worker, appropriate meta tags, and icons).
- Single-page app with client-side routing (use react-router-dom).
- NO backend. Everything is client-side only.
- All pages must be single-viewport, NO scrolling. Use flexbox/grid to fit content within 100vh/100vw.
- Design must be minimal, modern, clean, and idiot-proof.
- Support dark mode and light mode (default to system preference, toggle in Settings). Use CSS variables or Tailwind dark mode.
- Mobile-first responsive design that also works well on desktop.

=== VERSION CONTROL ===
- Use Semantic Versioning (SemVer). This Chunk 1 scaffold is version 0.1.0.
- Display the version number subtly in the bottom corner of every page.
- Each chunk will be a new git branch named "chunk-X" (this one is "chunk-1").
- Make a git commit with the message: "chunk-1: project scaffold — hollow shell with PWA setup, all pages, navigation, settings page, dark/light mode (v0.1.0)"
- DO NOT push or create a pull request. Only commit locally on the branch.

=== APP STRUCTURE ===

The app is called "CrewKit". It has 4 main sections:

1. **CrewCash** — Inflight allowance + location meal allowance calculator
2. **SkyMenu** — Singapore Airlines inflight menu viewer
3. **InkFlight** — Inflight menu homework formatter (print-ready reformatter)
4. **Settings** — User preferences, rate tables, theme toggle, JSON import/export

=== PAGE STRUCTURE & NAVIGATION ===

**Home Page (/):**
- App logo/name "CrewKit" centered prominently with a subtle tagline: "Your cabin crew toolkit"
- Below: 4 large, tappable cards/buttons in a 2x2 grid for: CrewCash, SkyMenu, InkFlight, Settings
- Each card has an icon, the feature name, and a one-line description
- No scrolling. Everything fits in one viewport.

**CrewCash Page (/crewcash):**
- Wizard-style stepper interface (step indicator dots/bar at top)
- Step 1: "Flight Input" — Placeholder for flight number input and date picker. Show a placeholder text "Enter your flight details". For multi-sector flights (e.g., SQ12: SIN→NRT→LAX→NRT→SIN), show a placeholder route chain visualization as connected nodes/breadcrumbs.
- Step 2: "Sector Overview" — Placeholder showing a visual timeline of all sectors with placeholder duration/location info. Each sector shown as a card.
- Step 3: "Allowance Breakdown" — Placeholder for results. Show placeholder cards for "Inflight Allowance", "Meal Allowance", "Total" with $0.00 values.
- Navigation: Back button (top-left) returns to Home. Next/Previous buttons at bottom of wizard. Steps are indicated visually.
- All within single viewport, no scroll.

**SkyMenu Page (/skymenu):**
- Wizard-style stepper interface
- Step 1: "Flight Selection" — Placeholder for flight number and date input (similar to CrewCash but independent for now)
- Step 2: "Menu Display" — Placeholder area showing "Menu will appear here" with placeholder sections for "First Class", "Business Class", "Premium Economy", "Economy". Each as a tab or toggle.
- Navigation: Back button to Home. Next/Previous for wizard steps.
- Single viewport, no scroll.

**InkFlight Page (/inkflight):**
- Wizard-style stepper interface
- Step 1: "Flight Selection" — Same placeholder flight input
- Step 2: "Menu Source" — Placeholder showing "Fetched menu data will appear here for editing"
- Step 3: "Customize Layout" — Placeholder area with text "Drag and arrange menu sections here". Show placeholder toggles for "Include headers", "Include prices", "Compact mode"
- Step 4: "Preview & Export" — Placeholder showing a mock print preview rectangle (receipt-width proportions, black and white). Placeholder export buttons: "Export PNG", "Export DOCX", "Export PDF"
- Navigation: Back to Home, Next/Previous wizard steps.
- Single viewport, no scroll.

**Settings Page (/settings):**
- Single viewport with sections (use tabs or accordion if needed to avoid scrolling):
  - Tab/Section 1: "Rates & Modifiers" — Placeholder list items for: "Meal Rates by Country", "Rank Modifier", "Other Modifiers". Each shows a placeholder label and a greyed-out input.
  - Tab/Section 2: "Appearance" — Dark/Light mode toggle (THIS MUST ACTUALLY WORK). Show current theme. Toggle switch that immediately changes the theme.
  - Tab/Section 3: "Data" — Two buttons: "Export Settings (JSON)" and "Import Settings (JSON)". Both are placeholder (non-functional) but styled properly.
  - Tab/Section 4: "About" — App name, version (0.1.0), brief description.
- Back button to Home.

=== DESIGN SYSTEM ===

Inspiration: Premium "quiet luxury" dark UI — editorial, calm, spacious (matched to the InkFlight reference screens).
The app should feel like a sophisticated crew companion: refined typography, generous negative space, gold used sparingly as a signal color.

**Color Palette (CSS variables required):**

Dark mode (DEFAULT primary aesthetic):
- --bg-base:        #070B14          /* deep near-black navy */
- --bg-surface:     #121826          /* elevated surface / cards */
- --bg-elevated:    #1A2234          /* dropdowns, modals, input wells */
- --border-subtle:  rgba(201, 168, 76, 0.12)  /* hairline gold-tinted borders */
- --border-medium:  rgba(201, 168, 76, 0.22)
- --text-primary:   #F0ECE4          /* soft ivory */
- --text-secondary: #8B95A8          /* muted slate */
- --text-tertiary:  #5C6578          /* disabled / footnotes */
- --accent:         #C9A84C          /* champagne gold */
- --accent-soft:    #E8D5A3          /* light gold highlight */
- --accent-dim:     #8A7333          /* pressed/dim gold */
- --accent-glow:    rgba(201, 168, 76, 0.35)
- --danger:         #C45B5B
- --success:        #5BA88A

Light mode:
- --bg-base:        #F5F2EB          /* warm paper */
- --bg-surface:     #FFFFFF
- --bg-elevated:    #EE honoured E8
- --border-subtle:  rgba(11, 30, 62, 0.08)
- --border-medium:  rgba(11, 30, 62, 0.14)
- --text-primary:   #0B1E3E          /* deep navy */
- --text-secondary: #5C6B80
- --text-tertiary:  #8B95A8
- --accent:         #A88B2E          /* slightly deeper gold for contrast on light */
- --accent-soft:    #C9A84C
- --accent-dim:     #7A6620
- --accent-glow:    rgba(168, 139, 46, 0.25)
- (danger/success same)

**Typography:**
- Display / Hero headlines: Elegant serif (import "Playfair Display" from Google Fonts). Large (clamp 2rem–3.5rem), light weight, with selective italic gold spans for emphasis (e.g. "save your ink").
- Section greetings / eyebrow: Playfair Display italic, accent gold, ~1.1rem.
- UI / Body: Inter (or system-ui fallback). Clean, readable.
- Labels / overlines: Inter Medium, 0.7rem, uppercase, letter-spacing 0.12em, text-secondary.
- Logo wordmark: Inter / system, with dual-tone treatment — first half primary text, second half accent gold (e.g. "Crew" ivory + "Kit" gold, or icon + mixed wordmark).
- Never use pure white (#FFF) or pure black (#000) on text.

**Surfaces & Elevation:**
- Base background is flat deep navy/black — NO large gradients filling the page.
- Cards and elevated panels: --bg-surface with 1px --border-subtle and border-radius 12–16px.
- Floating menus / popovers: --bg-elevated, 1px gold-tinted border, backdrop-blur (glass), soft shadow, radius 16px.
- Optional faint ambient radial glow behind primary CTAs (gold, low opacity).

**Buttons:**
- Primary CTA: Pill shape (rounded-full). Gold fill using linear gradient toward accent-soft. Text in deep navy. Soft outer glow (box-shadow with --accent-glow). Hover: brighten + slight lift. Active: scale 0.98.
- Secondary: Ghost / outline pill — transparent bg, 1px --border-medium, text-primary. Hover: bg-surface.
- Icon buttons (menu, back, close): Circular (radius full), ~40px, bg-elevated, border subtle, icon in text-secondary. Hover: icon → accent gold.
- Wizard Next/Previous: Primary pill for Next, ghost for Previous.

**Inputs:**
- Dark recessed wells (--bg-elevated), hairline border, radius 12px.
- Companion badges (e.g. "SQ" prefix): solid elevated pill beside the input, accent gold text.
- Focus: border-color → accent, soft gold ring.
- Labels above inputs use the overline style (uppercase, tracked).
- Placeholder text in text-tertiary.

**Icons:**
- Use lucide-react, 1.5–1.75 stroke width.
- Default color: text-secondary. Interactive hover: accent gold.
- Logo mark: simple paper-plane or abstract "CK" monogram inside a rounded square with gold treatment.

**Navigation & Chrome:**
- Top bar (optional on inner pages): minimal. Logo left, circular hamburger/menu right.
- Back button: circular icon button, top-left.
- Home cards (2×2 grid): elevated surface cards, radius 16px, icon in gold, feature name in serif or semibold sans, one-line description in text-secondary. Hover: border becomes accent-dim, subtle lift/glow.
- Floating dropdown menu (from hamburger): glass elevated panel, gold-tinted border, section rows with icon + title + subtitle, footer row with version. Matches reference menu style.
- Footer disclaimer / version: centered, text-tertiary, 0.65–0.75rem, fixed to bottom safe-area.

**Wizard Stepper:**
- Clean horizontal dots or short segmented bar.
- Active step: accent gold filled.
- Completed steps: accent-dim.
- Future steps: border only, text-tertiary.
- Optional tiny labels under dots (Inter overline style).
- Keep compact so content below still fits single viewport.

**Motion:**
- Page transitions: subtle fade + slight rise (120–200ms, ease-out).
- Theme switch: smooth CSS variable transition on background/color (200–300ms).
- Button presses: scale(0.98).
- No flashy / bouncy animations. Keep motion quiet and premium.

**Light mode notes:**
- Same geometry and typography. Swap to warm paper backgrounds and deep navy text.
- Gold accent darkens slightly for WCAG contrast on light surfaces.
- Primary CTA remains gold pill; text on CTA stays deep navy.
- Cards gain a very soft shadow instead of gold hairline if needed for definition.

**General UI principles:**
- Single viewport, NO scroll on any page (mobile or desktop).
- Mobile-first; desktop centers content with a sensible max-width (~480–560px) so it still feels app-like.
- Idiot-proof hit targets: min 44×44px.
- Clear hover / active / focus states on everything interactive.
- Generous negative space — prefer editorial centered layouts over dense dashboards.
- Gold is a signal color, not a fill color for large areas.

=== PWA REQUIREMENTS ===
- manifest.json with:
  - name: "CrewKit"
  - short_name: "CrewKit"
  - description: "Cabin crew toolkit for Singapore Airlines crew"
  - start_url: "/"
  - display: "standalone"
  - background_color: "#070B14"
  - theme_color: "#070B14"
  - Icons: Generate simple placeholder square icons (deep navy background with gold "CK" text) at 192x192 and 512x512 sizes. These can be simple SVG or generated PNG.
- Service worker: Register a basic service worker that caches the app shell for offline capability.
- Apple-specific meta tags for iOS PWA support (apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, apple-touch-icon).
- Viewport meta tag for mobile.

=== FILE & FOLDER STRUCTURE ===
Organize the project cleanly:

crewkit/
├── public/
│   ├── manifest.json
│   ├── sw.js (service worker)
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── favicon.ico
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css (Tailwind imports + CSS variables for theming)
│   ├── components/
│   │   ├── Layout.tsx (shell with version display)
│   │   ├── BackButton.tsx
│   │   ├── WizardStepper.tsx (reusable step indicator)
│   │   ├── ThemeToggle.tsx
│   │   └── NavCard.tsx (home page cards)
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── CrewCash.tsx
│   │   ├── SkyMenu.tsx
│   │   ├── InkFlight.tsx
│   │   └── Settings.tsx
│   ├── context/
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   └── useTheme.ts
│   └── config/
│       └── version.ts (export const APP_VERSION = "0.1.0")
├── README.md
├── PROMPT.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## Future Chunks

*(Future chunk prompts and design specifications will be appended in this section as development progresses.)*
