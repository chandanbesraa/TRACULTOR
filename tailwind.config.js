/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgMain: '#F7F7F5',
        primary: {
          DEFAULT: '#1F5E3B',
          dark: '#16452B',
          light: '#28734A',
          hover: '#194E31',
        },
        secondary: {
          DEFAULT: '#3F7D4C',
          light: '#4E935D',
          dark: '#31633B',
        },
        cardBg: '#FFFFFF',
        textMain: '#1A1A1A',
        textMuted: '#555555',
        borderMain: '#E2E2DC',
        borderDark: '#C8C8BE',
        accentGold: '#B8860B',
        accentRed: '#C53030',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
