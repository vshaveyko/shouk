import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "24px",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-soft": "var(--bg-soft)",
        "bg-panel": "var(--bg-panel)",
        surface: "var(--surface)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        muted: "var(--muted)",
        hover: "var(--hover)",
        blue: {
          DEFAULT: "var(--blue)",
          ink: "var(--blue-ink)",
          soft: "var(--blue-soft)",
          softer: "var(--blue-softer)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          soft: "var(--warn-soft)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
        },
        amber: {
          DEFAULT: "var(--amber)",
          soft: "var(--amber-soft)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter Tight", "ui-sans-serif", "system-ui"],
        serif: ["var(--font-serif)", "Instrument Serif", "ui-serif", "Georgia"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace"],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "10px",
        md: "10px",
        lg: "14px",
        xl: "16px",
      },
      boxShadow: {
        sm: "0 1px 2px oklch(0.2 0.02 240 / 0.04)",
        DEFAULT:
          "0 1px 2px oklch(0.2 0.02 240 / 0.04), 0 2px 10px -6px oklch(0.2 0.02 240 / 0.08)",
        lg: "0 12px 40px -12px oklch(0.2 0.02 240 / 0.2)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "fade-in-up": "fade-in-up 220ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
