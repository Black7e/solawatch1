/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // X/Twitter-inspired color palette
        'x-bg': {
          DEFAULT: '#000000',
          'secondary': '#16181c',
          'tertiary': '#212327',
        },
        'x-border': {
          DEFAULT: '#2f3336',
          'light': '#536471',
        },
        'x-text': {
          DEFAULT: '#e7e9ea',
          'secondary': '#71767b',
          'tertiary': '#536471',
        },
        'x-blue': {
          DEFAULT: '#1d9bf0',
          'hover': '#1a8cd8',
          'light': '#1d9bf0',
        },
        'x-purple': {
          DEFAULT: '#794bc4',
          'hover': '#6b3fa8',
        },
        'x-green': {
          DEFAULT: '#00ba7c',
          'hover': '#00a06b',
        },
        'x-red': {
          DEFAULT: '#f91880',
          'hover': '#e0176f',
        },
      },
      fontFamily: {
        'x': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'x': '16px',
        'x-lg': '20px',
      },
      boxShadow: {
        'x': '0 0 0 1px rgba(255, 255, 255, 0.1)',
        'x-hover': '0 0 0 1px rgba(255, 255, 255, 0.2)',
      },
    },
  },
  plugins: [],
};
