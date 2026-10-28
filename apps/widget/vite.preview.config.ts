import { defineConfig } from "vite";

// Builds index.html (the dashboard's live preview page) next to the
// embeddable script, so dist/ holds both instagram.iife.js and the preview.
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
  },
});
