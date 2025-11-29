/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Anton', 'Impact', 'sans-serif'],
      },
      colors: {
        proper: {
          red: '#D00000',
          dark: '#0a0a0a',
          light: '#ffffff',
          gray: '#f5f5f5',
        },
        accent: {
          DEFAULT: '#a855f7', // vibrant purple for primary action
          dark: '#9333ea',
          light: '#d8b4fe',
        },
        slate: {
          950: '#030712',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#e2e8f0',
            h1: { color: '#ffffff', fontWeight: '700' },
            h2: { color: '#ffffff', fontWeight: '600' },
            h3: { color: '#f1f5f9', fontWeight: '600' },
            strong: { color: '#ffffff' },
            a: { color: '#a855f7', '&:hover': { color: '#d8b4fe' } },
            code: { color: '#e2e8f0', backgroundColor: '#1e293b', borderRadius: '0.375rem', padding: '0.25rem 0.5rem' },
          },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
