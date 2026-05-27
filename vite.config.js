import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api/ai': {
        target: 'https://api.cloudflare.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai/, '/client/v4/accounts/bf5126510c1f8f2759cc81c4e7d795ef/ai/run'),
      }
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});