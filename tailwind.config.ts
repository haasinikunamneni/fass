import type { Config } from "tailwindcss";

/**
 * Design tokens. Colour values live as CSS variables in src/styles/tokens.css
 * so the palette can evolve (or be themed) without touching components.
 */
const rgb = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  future: { hoverOnlyWhenSupported: true },
  theme: {
    screens: {
      sm: "640px",
      md: "768px", // tablet
      lg: "1024px", // laptop, desktop navigation
      xl: "1280px",
      "2xl": "1600px", // large desktop
    },
    extend: {
      colors: {
        obsidian: rgb("obsidian"),
        forest: rgb("forest"),
        emerald: rgb("emerald"),
        champagne: rgb("champagne"),
        ivory: rgb("ivory"),
      },
      fontFamily: {
        display: [
          '"Cormorant Garamond"',
          "Cormorant",
          '"Bodoni MT"',
          "Didot",
          "Georgia",
          "serif",
        ],
        sans: ['"Inter"', '"Segoe UI"', "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": [
          "clamp(2.75rem, 5.6vw, 6.25rem)",
          { lineHeight: "0.98", letterSpacing: "-0.015em" },
        ],
        "display-lg": [
          "clamp(2.25rem, 4.4vw, 4.5rem)",
          { lineHeight: "1", letterSpacing: "-0.01em" },
        ],
        "display-md": [
          "clamp(1.75rem, 3vw, 3rem)",
          { lineHeight: "1.05", letterSpacing: "-0.005em" },
        ],
        heading: ["1.5rem", { lineHeight: "1.2" }],
        "body-lg": ["clamp(1rem, 1.2vw, 1.1875rem)", { lineHeight: "1.65" }],
        body: ["0.9375rem", { lineHeight: "1.7" }],
        caption: ["0.8125rem", { lineHeight: "1.5" }],
        eyebrow: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.32em" }],
      },
      spacing: {
        gutter: "clamp(1.25rem, 4vw, 4rem)",
        section: "clamp(5rem, 12vw, 10rem)",
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        400: "400ms",
        700: "700ms",
        1200: "1200ms",
      },
      maxWidth: {
        maison: "1680px",
      },
    },
  },
  plugins: [],
};

export default config;
