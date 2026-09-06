/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        canvas: 'var(--wm-canvas)',
        surface: 'var(--wm-surface)',
        elevated: 'var(--wm-elevated)',
        ink: 'var(--wm-ink)',
        muted: 'var(--wm-muted)',
        accent: 'var(--wm-accent)',
        'accent-ink': 'var(--wm-accent-ink)',
        line: 'var(--wm-line)',
        danger: 'var(--wm-danger)',
      },
    },
  },
  plugins: [],
};
