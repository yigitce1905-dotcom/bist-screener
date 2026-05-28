/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0d1117",
          secondary: "#161b22",
          card: "#1c2128",
          hover: "#21262d",
        },
        accent: {
          green: "#00ff88",
          greenDim: "#00c96a",
          red: "#ff4d4d",
          blue: "#58a6ff",
          yellow: "#e3b341",
          purple: "#bc8cff",
          orange: "#f78166",
        },
        border: {
          DEFAULT: "#30363d",
          light: "#444c56",
        },
        text: {
          primary: "#e6edf3",
          secondary: "#8b949e",
          muted: "#484f58",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-green": "pulseGreen 2s ease-in-out infinite",
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        pulseGreen: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
