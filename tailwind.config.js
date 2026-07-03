/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#B22222',    // Brand red
        secondary: '#1a1a1a',  // Dark
        accent: '#D4AF37',     // Gold accent
        'primary-dark': '#8B0000',
        'bg-light': '#f5f5f5',
        'text-dark': '#333333',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
