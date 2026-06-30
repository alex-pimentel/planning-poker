/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        poker: {
          50: '#e6fafe',
          100: '#b3f0fc',
          200: '#80e5fa',
          300: '#4ddbf8',
          400: '#1ad0f5',
          500: '#00abec',
          600: '#0089c0',
          700: '#006794',
          800: '#004568',
          900: '#00223c',
          950: '#001122',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
