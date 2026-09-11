/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sonatrach: { DEFAULT: '#f47920', 50: '#fff7ed', 100: '#ffedd5', 500: '#f47920', 600: '#ea580c', 700: '#c2410c' },
        ink: '#0f172a',
      },
      fontFamily: { sans: ['IBM Plex Sans', 'sans-serif'], heading: ['Manrope', 'sans-serif'] },
      boxShadow: { soft: '0 8px 30px rgba(15, 23, 42, .06)' },
    },
  },
  plugins: [],
};
