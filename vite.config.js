import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_GITHUB_PAGES_BASE || "/",
  esbuild: {
    jsx: "automatic",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) return "firebase";
          if (id.includes("node_modules/@codemirror") || id.includes("node_modules/@lezer")) return "codemirror";
          if (id.includes("node_modules/chart.js")) return "charts";
          if (id.includes("node_modules/bootstrap") || id.includes("node_modules/sortablejs")) return "ui-vendor";
        },
      },
    },
  },
});
