import type { Config } from "tailwindcss";

const config: Config = {
  // ✅ Dark/Light tema class ile yönetilecek (next-themes için şart)
  darkMode: ["class"],

  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",

    // ✅ ileride src açarsan otomatik çalışsın (zararı yok)
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {},
  },

  plugins: [],
};

export default config;