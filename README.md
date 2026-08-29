# CrewKit — Singapore Airlines Cabin Crew Progressive Web App (PWA)

> **Current Version:** `v0.1.0` (Chunk 1: Project Scaffold)  
> **Status:** Hollow Shell &amp; PWA Scaffold — All pages, navigation, settings, responsive zero-scroll layouts, and dark/light mode functional.

---

## Overview

**CrewKit** is an editorial, "quiet luxury" Progressive Web App (PWA) designed exclusively for Singapore Airlines cabin crew. Designed with refined typography, hairline gold accents, generous negative space, and single-viewport ergonomics, CrewKit provides immediate offline access to essential inflight tools without unnecessary bloat or complexity.

---

## Core Features

1. **CrewCash (`/crewcash`)**
   - Inflight hourly allowance &amp; location meal per diem calculator.
   - Stepper wizard interface with multi-sector route chain visualizations (e.g., `SIN → NRT → LAX → NRT → SIN`).
   - Sector timeline duration breakdowns and allowance tally placeholders.

2. **SkyMenu (`/skymenu`)**
   - Singapore Airlines scheduled inflight menu browser.
   - Fast sector lookup with interactive cabin class switching (*Suites / First, Business, Premium Economy, Economy*).
   - Menu course categorizations (*Appetisers, Mains, Desserts, Wine &amp; Beverages*).

3. **InkFlight (`/inkflight`)**
   - Inflight menu homework formatter and thermal printer slip generator.
   - Print-ready black-and-white receipt formatting optimized for pocket thermal printers to save ink.
   - Layout customizer (*toggle headers, toggle prices, compact mode*) and multi-format exports (*PNG, DOCX, PDF*).

4. **Settings (`/settings`)**
   - **Appearance:** Fully functional Dark Mode (near-black navy `#070B14`) and Light Mode (warm paper `#F5F2EB`) with persistent storage.
   - **Rates &amp; Modifiers:** Customizable station meal rates and seniority multipliers.
   - **Data Management:** JSON settings export and import tools.
   - **About:** System architecture and version diagnostics.

---

## Design System & Principles

- **Single Viewport, Zero Scrolling:** Every page is structured with flexbox/grid containers locked to `100dvh` / `100vh` (`overflow-hidden`), guaranteeing zero accidental scrolling on iOS, Android, or desktop.
- **Editorial Typography:** Google Fonts *Playfair Display* for elegant display headings and *Inter* for crisp, high-legibility UI labels.
- **Color Palette (CSS Variables):**
  - **Dark Mode (Default):** Deep near-black navy (`#070B14`), card surface (`#121826`), recessed wells (`#1A2234`), champagne gold accents (`#C9A84C`), soft gold highlights (`#E8D5A3`), and ivory text (`#F0ECE4`).
  - **Light Mode:** Warm paper (`#F5F2EB`), white surface (`#FFFFFF`), warm recessed wells (`#EAE5D9`), deep navy text (`#0B1E3E`), and rich gold accent (`#A88B2E`).
- **Pill CTAs & Touch Targets:** All interactive elements feature minimum 44×44px hit targets with subtle tactile feedback (`scale(0.98)` on active press).

---

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Bundler & Tooling:** Vite 6
- **Styling:** Tailwind CSS 3.4 + Custom CSS Variables
- **Icons:** Lucide React
- **Routing:** React Router DOM (client-side single page app)
- **PWA Capabilities:** Standalone Manifest (`manifest.json`), Offline App Shell Caching (`sw.js`), Apple Web App meta tags, and SVG/PNG icon suite.

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm / yarn

### Installation & Local Development
```bash
# Clone repository
git clone https://github.com/harlequinzxc/CrewKit.git
cd CrewKit

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173` (or the network preview host).

### Production Build
```bash
npm run build
npm run preview
```

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

### Desktop (Chrome / Edge / Safari)
1. In Chrome/Edge, click the install icon in the right side of the address bar.
2. Click **Install**. CrewKit will launch in its own dedicated app window.

---

## Project Structure

```
CrewKit/
├── public/
│   ├── favicon.ico             # 64x64 favicon
│   ├── favicon.svg             # Vector luxury SVG favicon
│   ├── manifest.json           # PWA web app manifest
│   ├── sw.js                   # App shell service worker cache
│   └── icons/
│       ├── icon-192.png        # Standard 192x192 PWA icon
│       ├── icon-192-maskable.png # Maskable 192x192 icon
│       ├── icon-512.png        # Standard 512x512 PWA icon
│       └── icon-512-maskable.png # Maskable 512x512 icon
├── src/
│   ├── main.tsx                # App entry point + PWA service worker registration
│   ├── App.tsx                 # Route declarations (react-router-dom)
│   ├── index.css               # Global styles, CSS variables & typography
│   ├── vite-env.d.ts           # Vite client TypeScript definitions
│   ├── components/
│   │   ├── BackButton.tsx      # Circular navigation back button
│   │   ├── Layout.tsx          # Viewport shell with header, menu & version
│   │   ├── NavCard.tsx         # Home 2x2 luxury action cards
│   │   ├── ThemeToggle.tsx     # Reactive light/dark theme switch
│   │   └── WizardStepper.tsx   # Reusable step indicator
│   ├── context/
│   │   └── ThemeContext.tsx    # Theme provider with localStorage persistence
│   ├── hooks/
│   │   └── useTheme.ts         # Theme hook
│   ├── pages/
│   │   ├── Home.tsx            # Main landing page & 2x2 tool grid
│   │   ├── CrewCash.tsx        # Inflight & layover allowance calculator
│   │   ├── SkyMenu.tsx         # SIA inflight menu viewer
│   │   ├── InkFlight.tsx       # Thermal slip print homework formatter
│   │   └── Settings.tsx        # Rates, theme preferences & diagnostics
│   └── config/
│       └── version.ts          # Version definition (v0.1.0)
├── index.html                  # HTML entry point with meta tags & fonts
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── README.md
└── PROMPT.md
```

---

## Roadmap & Planned Chunks

| Chunk | Version | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Chunk 1** | `v0.1.0` | **Project Scaffold** — Hollow shell, PWA setup, single-viewport layouts, navigation, theme toggle | **Completed** |
| **Chunk 2** | `v0.2.0` | **CrewCash Logic** — SIA sector data, meal rate tables, flight hours allowance calculator | *Planned* |
| **Chunk 3** | `v0.3.0` | **SkyMenu Integration** — SIA flight menu data parsing, course display & filtering | *Planned* |
| **Chunk 4** | `v0.4.0` | **InkFlight Formatter Engine** — Thermal printer layouts, slip customizer, multi-format export | *Planned* |
| **Chunk 5** | `v1.0.0` | **Settings, Persistence & Offline Sync** — Local storage rates editor, JSON sync, full production release | *Planned* |

> *Note: This repository represents Chunk 1 (Project Scaffold). All pages and UI steppers are fully navigable with live theme switching.*
