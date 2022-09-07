/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        blue: "#38e9e9",
        yellow: "#ffff5a",
        pink: "#ff66cc",
      },
      fontFamily: {
        sans: ["Denk One", "sans-serif"],
      },
    },
  },
  plugins: [],
};
