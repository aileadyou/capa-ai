import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Skip watching dirs that never feed HMR; keeps the inotify watch count
    // well under the system limit (raw fonts, the SQLite db, and seed JSON).
    watch: {
      ignored: [
        "**/design_system/**",
        "**/server/data/**",
        "**/seed-data/**",
        "**/.git/**",
      ],
    },
    // All data + AI traffic is served by the Express/SQLite backend (server/).
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET ?? "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
