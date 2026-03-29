import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    allowedHosts: true,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.png"],
      workbox: {
        // Disable SPA navigation fallback so Cloudflare Access can intercept
        // expired sessions and redirect to its login page.
        // Nginx already handles SPA routing via try_files.
        navigateFallback: null,
        // Don't cache-bust already-hashed assets (Vite adds hashes to filenames)
        dontCacheBustURLsMatching: /\.[a-f0-9]{8}\./,
        // Only precache these file types (avoid caching everything)
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        // Remove outdated caches from previous service worker versions
        cleanupOutdatedCaches: true,
        // Immediately take control on activation (don't wait for tab close)
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: "Miam",
        short_name: "Miam",
        description: "Manage and organize your recipes",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icon-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icon-192x192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
