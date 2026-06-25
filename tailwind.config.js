/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#2563eb', // blue-600
          light: '#f8fafc', // slate-50
          dark: '#0f172a', // slate-900
          success: '#10b981', // emerald-500
        }
      }
    },
  },
  plugins: [],
}