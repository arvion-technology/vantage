import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// base "./" + a fixed entry filename is what lets the Vite build drop straight
// into demo/: the gallery serves demo/index.html from a sub-path, and the gate
// expects a real demo/app.js rather than a stub.
export default defineConfig({
  base: "./",
  plugins: [vue()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "app.js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  server: { port: 5173 },
});
