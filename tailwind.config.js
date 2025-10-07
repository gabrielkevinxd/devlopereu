/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0D0D0D',
        'gray-light': '#BFBFBF',
        'gray-medium': '#595959',
        'gray-dark': '#262626',
        gold: '#D4AF37',
      },
      fontFamily: {
        anton: ['Anton', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
};