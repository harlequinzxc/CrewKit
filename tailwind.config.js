/** @type {import('tailwindcss').Config} */
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Semantic Token Ramp with opacity support
        ink: {
          950: withOpacity('--ink-950-rgb'),
          900: withOpacity('--ink-900-rgb'),
          850: withOpacity('--ink-850-rgb'),
          800: withOpacity('--ink-800-rgb'),
          700: withOpacity('--ink-700-rgb'),
          600: withOpacity('--ink-600-rgb'),
          500: withOpacity('--ink-500-rgb'),
          airline: '#002569',
        },
        gold: {
          100: withOpacity('--gold-100-rgb'),
          200: withOpacity('--gold-200-rgb'),
          300: withOpacity('--gold-300-rgb'),
          400: withOpacity('--gold-400-rgb'),
          500: withOpacity('--gold-500-rgb'),
          600: withOpacity('--gold-600-rgb'),
          dim: 'var(--gold-dim)',
          glow: 'var(--gold-glow)',
        },
        ivory: {
          100: withOpacity('--ivory-100-rgb'),
          200: withOpacity('--ivory-200-rgb'),
        },
        mist: {
          300: withOpacity('--mist-300-rgb'),
          400: withOpacity('--mist-400-rgb'),
          500: withOpacity('--mist-500-rgb'),
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
        'bg-base': withOpacity('--ink-950-rgb'),
        'bg-surface': withOpacity('--ink-900-rgb'),
        'bg-elevated': withOpacity('--ink-850-rgb'),
        'border-subtle': 'var(--gold-dim)',
        'border-medium': 'var(--gold-border)',
        'border-hover': 'var(--gold-border-hover)',
        'text-primary': withOpacity('--ivory-100-rgb'),
        'text-secondary': withOpacity('--mist-300-rgb'),
        'text-tertiary': withOpacity('--mist-400-rgb'),
        'accent': withOpacity('--gold-400-rgb'),
        'accent-soft': withOpacity('--gold-100-rgb'),
        'accent-dim': withOpacity('--gold-500-rgb'),
        'accent-glow': 'var(--gold-glow)',
        'danger': 'var(--danger)',
        'success': 'var(--success)',
      },
      fontFamily: {
        display: ['"Playfair Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        ui: ['Inter', 'Jost', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'Jost', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        eyebrow: '0.22em',
        'eyebrow-wide': '0.34em',
      },
      boxShadow: {
        'cabin-glass': 'var(--shadow-cabin-glass)',
        'cabin': 'var(--shadow-cabin)',
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
