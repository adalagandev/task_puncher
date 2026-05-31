/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // Fight-night design tokens — centralized so every component shares one palette,
    // type system, and the signature hard-offset "punch" shadow instead of ad-hoc values.
    extend: {
      colors: {
        ink: "#17120f", // warm near-black — text, borders, hard shadows
        bone: "#f1e7d2", // warm paper background
        canvas: "#fbf5e8", // lighter card surface
        knockout: "#e63916", // punchy red-orange accent
        "knockout-dark": "#bf2c0f",
        gold: "#f7b500", // championship gold
      },
      fontFamily: {
        display: ["Anton", "Impact", "sans-serif"],
        sans: ["Archivo", "system-ui", "sans-serif"],
      },
      boxShadow: {
        punch: "5px 5px 0 0 #17120f",
        "punch-sm": "3px 3px 0 0 #17120f",
        "punch-gold": "5px 5px 0 0 #f7b500",
        "punch-red": "5px 5px 0 0 #e63916",
      },
      // Staggered card entrance — cards "slam" in on load for energy.
      keyframes: {
        slamIn: {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        slam: "slamIn 0.4s cubic-bezier(0.2, 0.85, 0.25, 1) both",
      },
    },
  },
  plugins: [],
};
