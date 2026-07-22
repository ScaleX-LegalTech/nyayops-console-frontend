import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// base: "/" - console's frontend is served at the app root (main.py:serve_frontend),
// unlike platform-admin-dashboard (/admin) or CDE's dashboard (/dashboard) which share a
// FastAPI app with other concerns. Console's FastAPI app IS the whole app.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5176,
    proxy: {
      "/api": "http://localhost:8002",
    },
  },
  build: {
    outDir: "dist",
  },
});
