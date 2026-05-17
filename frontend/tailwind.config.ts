import type { Config } from "tailwindcss";
const { heroui } = require("@heroui/react");

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 2px 16px 0 rgba(0,0,0,0.06)",
        card: "0 4px 24px 0 rgba(0,0,0,0.07)",
        float: "0 8px 32px 0 rgba(0,0,0,0.10)",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          layout: {
            radius: {
              small: "8px",
              medium: "12px",
              large: "16px",
            },
          },
        },
      },
    }),
  ],
};

export default config;
