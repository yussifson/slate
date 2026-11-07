import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'
import electron from 'vite-plugin-electron/simple'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron' || process.env.ELECTRON === 'true';
  return {
    logLevel: 'warn',
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/api/ai': {
          target: 'https://api.cloudflare.com',
          changeOrigin: true,
          rewrite: (path) => {
            const match = path.match(/^\/api\/ai\/([^\/]+)\/(.+)$/);
            if (match) {
              return `/client/v4/accounts/${match[1]}/ai/run/${match[2]}`;
            }
            return path.replace(/^\/api\/ai/, '/client/v4/accounts/bf5126510c1f8f2759cc81c4e7d795ef/ai/run');
          },
        }
      }
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 5000,
      reportCompressedSize: false,
      minify: 'esbuild',
      cssMinify: true,
      rollupOptions: {
        maxParallelFileOps: 2,
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@tldraw')) return 'vendor-tldraw';
              if (id.includes('three')) return 'vendor-three';
              if (id.includes('pdfjs-dist') || id.includes('jspdf')) return 'vendor-pdf';
              if (id.includes('lucide-react')) return 'vendor-lucide';
              if (id.includes('@xyflow')) return 'vendor-xyflow';
              if (id.includes('@daily-co')) return 'vendor-daily';
              if (id.includes('chart.js') || id.includes('recharts')) return 'vendor-charts';
            }
          }
        }
      }
    },
    plugins: [
      react(),
      isElectron && electron({
        main: {
          entry: 'electron/main.js',
          vite: {
            build: {
              rollupOptions: {
                external: ['electron-updater']
              }
            }
          }
        },
        preload: {
          input: 'electron/preload.js',
        },
        renderer: {},
      }),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        selfDestroying: true,
        manifest: false,
        workbox: false
      })
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      exclude: ['@journeyapps/wa-sqlite', '@powersync/web']
    },
  };
});
