import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.img"],
  server: {
    port: 5173,
    proxy: {
      "/admin": {
        target: process.env.VITE_API_PROXY || "http://localhost:6013",
        changeOrigin: true,
      },
      "/images": {
        target: process.env.VITE_API_PROXY || "http://localhost:6013",
        changeOrigin: true,
      },
    },
  },
});
