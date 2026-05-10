import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        moss: "#496b54",
        mint: "#dff4e8",
        paper: "#fbfaf5",
        coral: "#f26b5f",
        amber: "#f3ba4d",
        sky: "#8bbbd9"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 32, 27, 0.12)"
      }
    }
  },
  plugins: []
} satisfies Config;
