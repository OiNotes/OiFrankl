/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#FAFAF9',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B6B',
        'accent-warm': '#B8860B',
        'accent-purple': '#8B4789',
        'accent-blue': '#4A6FA5',
        'accent-green': '#2E7D32',
        'border-light': '#E5E5E5',
      },
      fontFamily: {
        'serif': ['Crimson Pro', 'Georgia', 'serif'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

