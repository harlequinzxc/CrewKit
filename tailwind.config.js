/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'border-subtle': 'var(--border-subtle)',
        'border-medium': 'var(--border-medium)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'accent': 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-dim': 'var(--accent-dim)',
        'accent-glow': 'var(--accent-glow)',
        'danger': 'var(--danger)',
        'success': 'var(--success)',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 20px var(--accent-glow)',
        'gold-glow-lg': '0 0 35px var(--accent-glow)',
        'card-subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.15)',
        'elevated-glass': '0 10px 30px -5px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        'card': '16px',
        'well': '12px',
      }
    },
  },
  plugins: [],
}
