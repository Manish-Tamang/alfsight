import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "InstagramWidget",
      fileName: "instagram",
      formats: ["iife"],
    },
    // Keep the bundle small
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Single file output — no code splitting for an embeddable script
        inlineDynamicImports: true,
      },
    },
    // Output to dist/
    outDir: "dist",
    emptyOutDir: true,
  },
  // Dev server for testing
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "https://localhost:8787",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
