/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Semantic Token Ramp
        ink: {
          950: 'var(--ink-950)',
          900: 'var(--ink-900)',
          850: 'var(--ink-850)',
          800: 'var(--ink-800)',
          700: 'var(--ink-700)',
          600: 'var(--ink-600)',
          airline: '#002569',
        },
        gold: {
          100: 'var(--gold-100)',
          300: 'var(--gold-300)',
          400: 'var(--gold-400)',
          500: 'var(--gold-500)',
          dim: 'var(--gold-dim)',
          glow: 'var(--gold-glow)',
        },
        ivory: {
          100: 'var(--ivory-100)',
          200: 'var(--ivory-200)',
        },
        mist: {
          300: 'var(--mist-300)',
          400: 'var(--mist-400)',
          500: 'var(--mist-500)',
        },
        // Constant Onyx (Deep Ink in BOTH themes for text on gold fills)
        onyx: {
          950: '#070B14',
          900: '#0B1220',
          800: '#121A2D',
        },
        // Dietary / Status Chips
        chip: {
          wellness: 'var(--chip-wellness)',
          'wellness-text': 'var(--chip-wellness-text)',
          veg: 'var(--chip-veg)',
          'veg-text': 'var(--chip-veg-text)',
          amber: 'var(--chip-amber)',
          'amber-text': 'var(--chip-amber-text)',
          sky: 'var(--chip-sky)',
          'sky-text': 'var(--chip-sky-text)',
        },
        // Backward-compatible semantic aliases
        'bg-base': 'var(--ink-950)',
        'bg-surface': 'var(--ink-900)',
        'bg-elevated': 'var(--ink-850)',
        'border-subtle': 'var(--gold-dim)',
        'border-medium': 'var(--gold-border)',
        'border-hover': 'var(--gold-border-hover)',
        'text-primary': 'var(--ivory-100)',
        'text-secondary': 'var(--mist-300)',
        'text-tertiary': 'var(--mist-400)',
        'accent': 'var(--gold-400)',
        'accent-soft': 'var(--gold-100)',
        'accent-dim': 'var(--gold-500)',
        'accent-glow': 'var(--gold-glow)',
        'danger': 'var(--danger)',
        'success': 'var(--success)',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        ui: ['Jost', 'Inter', 'sans-serif'],
        sans: ['Inter', 'Jost', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        eyebrow: '0.22em',
        'eyebrow-wide': '0.32em',
      },
      boxShadow: {
        'cabin-glass': 'var(--shadow-cabin-glass)',
        'gold-glow': '0 0 25px var(--gold-glow)',
        'gold-glow-lg': '0 0 45px var(--gold-glow)',
        'elevated-card': 'var(--shadow-elevated-card)',
      },
      borderRadius: {
        'cabin': '24px',
        'card': '18px',
        'well': '14px',
      },
    },
  },
  plugins: [],
}
