/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: { disabled: '#9ACEE9' },
        'light-blue': { 50: '#F0F9FF', 100: '#E0F2FE', 600: '#0284C7' },
      },
    },
  },
  plugins: [],
};
