/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.vue",
    "./app/Livewire/**/*.php",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0b0c",
        foreground: "#f5f5f4",
        brand: {
          accent: "#bfa78a",
          strong: "#8f6f54",
          panel: "#111315",
          elevated: "#151718",
        },
      },
      fontFamily: {
        serif: ["Georgia", "ui-serif", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        signature: ["Great Vibes", "Allura", "Dancing Script", "cursive"],
      },
      boxShadow: {
        soft: "0 24px 80px rgba(0, 0, 0, 0.35)",
      },
      maxWidth: {
        content: "80rem",
        reading: "56rem",
      },
    },
  },
  plugins: [],
};
