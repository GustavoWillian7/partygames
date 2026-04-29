/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        primary: '#8b5cf6',
        accent: '#a3e635',
        info: '#22d3ee',
        danger: '#ef4444',
        success: '#22c55e',
        text: '#f8fafc',
        muted: '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
