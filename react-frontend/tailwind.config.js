/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EAF4FB',
          100: '#D8EBF7',
          200: '#B9D9EE',
          300: '#8FC1E0',
          400: '#5DA0C8',
          500: '#2C7FB7',
          600: '#146EB4',
          700: '#185987',
          800: '#12304A',
          900: '#102A43',
        },
        hero: '#185987',
        'light-blue': '#EAF4FB',
        'app-background': '#F7F9FC',
        card: '#FFFFFF',
        border: '#E2E8F0',
        main: '#14213D',
        secondary: '#52647A',
        success: '#16805C',
        warning: '#B7791F',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
