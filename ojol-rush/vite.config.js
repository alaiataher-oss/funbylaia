import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/static/ojol-rush/",
  build: {
    outDir: "../static/ojol-rush",
    emptyOutDir: true,
    assetsDir: "assets",
  },
  server: { port: 5174 },
});
