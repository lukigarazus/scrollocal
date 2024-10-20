const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#4c1d95",
        accentInverse: "#c4b5fd",
        bgDeep: "#020617",
        bgFront: "#0f172a",
        textFront: "#1e293b",
      },
    },
  },
  plugins: [],
};
