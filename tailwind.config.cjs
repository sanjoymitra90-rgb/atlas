/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.js'
  ],
  safelist: [
    'text-emerald-400',
    'text-amber-400',
    'text-red-400',
    'text-[10px]'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
