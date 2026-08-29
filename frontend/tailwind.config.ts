import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        zinc: {
          850: "#1f1f23",
          950: "#09090b",
        },
        ops: {
          bg: "#09090b",
          surface: "#18181b",
          surfaceHover: "#27272a",
          border: "#27272a",
          borderSubtle: "#1f1f23",
          textMuted: "#a1a1aa",
          textPrimary: "#f4f4f5",
        },
      },
    },
  },
  plugins: [],
};
export default config;
