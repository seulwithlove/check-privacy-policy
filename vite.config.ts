import { defineConfig } from "vite";

// The popup is the only entry in Phase 1. Static files (manifest, icons) live in /public.
export default defineConfig({
  root: "src/popup",
  publicDir: "../../public",
  base: "./",
  build: { outDir: "../../dist", emptyOutDir: true, target: "es2022" },
  test: { root: ".", include: ["tests/**/*.test.ts"] },
});
