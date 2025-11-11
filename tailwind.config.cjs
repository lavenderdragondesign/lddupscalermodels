/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ldd1: "#a78bfa", // lavender
        ldd2: "#22c55e"  // green accent
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "Apple Color Emoji", "Segoe UI Emoji"]
      }
    },
  },
  plugins: [],
};
