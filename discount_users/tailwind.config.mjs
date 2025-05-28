/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'deep-red': '#8E0D3C',
        'blackcurrant': '#1D1842',
        'orange': '#EF3B33',
        'rose-pink': '#FDA1A2',
      },
    },
  },
  plugins: [],
}

export default config