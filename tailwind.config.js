/** @type {import('tailwindcss').Config} 
export default {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
}*/

// tailwind.config.js
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./dist/index.html",
  ],
  theme: {},
  plugins: [],
};
