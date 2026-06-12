/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'gf-bg': '#F8F9FA',
        'gf-bg-card': '#FFFFFF',
        'gf-text': '#202124',
        'gf-text-secondary': '#5F6368',
        'gf-positive': '#137333',
        'gf-positive-bg': '#E6F4EA',
        'gf-negative': '#C5221F',
        'gf-negative-bg': '#FCE8E6',
        'gf-accent': '#1A73E8',
        'gf-accent-light': '#E8F0FE',
        'gf-border': '#DADCE0',
        'gf-neutral': '#F1F3F4',
        'gf-neutral-text': '#80868B',
      },
      fontFamily: {
        sans: ['Google Sans', 'Roboto', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'gf-card': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'gf-card-hover': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
      },
    },
  },
  plugins: [],
}
