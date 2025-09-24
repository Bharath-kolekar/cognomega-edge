/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx,html}"],
  darkMode: ["class", '[data-theme="dark"]'],
  safelist: [
    "glass-card","glass-surface-soft","shadow-glass",
    "btn-base","btn-primary","btn-secondary","btn-ghost",
    "message-bubble","badge-gradient","shine"
  ],
  theme: {
    extend: {
      boxShadow: { glass: "0 10px 30px rgba(0,0,0,.15)" }
    }
  },
  plugins: []
};
