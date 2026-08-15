import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        stellar: {
          blue: "#0052FF",
          dark: "#0A0E27",
          light: "#E8EDFF",
        },
        trust: {
          unverified: "#6B7280",
          emerging: "#F59E0B",
          established: "#3B82F6",
          trusted: "#10B981",
          elite: "#6366F1",
        },
        score: {
          red: "#EF4444",
          orange: "#F97316",
          yellow: "#EAB308",
          green: "#22C55E",
          blue: "#6366F1",
        },
      },
      animation: {
        "score-ring": "score-ring 1.5s ease-out forwards",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
      keyframes: {
        "score-ring": {
          "0%": { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "var(--score-offset)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
