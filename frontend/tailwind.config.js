/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4F2EC',
        ink: '#20302A',
        brand: {
          DEFAULT: '#2F5D50',
          dark: '#1E3F36',
          light: '#5B8C7B',
        },
        clay: '#C17A47',
        danger: '#AE3B33',
        confirm: '#3E7C55',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
