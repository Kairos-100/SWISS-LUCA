import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-${Date.now()}-[hash].js`,
        chunkFileNames: `assets/[name]-${Date.now()}-[hash].js`,
        assetFileNames: `assets/[name]-${Date.now()}-[hash].[ext]`,
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    },
    // Optimizaciones de rendimiento
    minify: 'esbuild',
    // Mejorar el rendimiento de carga
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },
  // Optimizaciones de desarrollo
  server: {
    hmr: {
      overlay: false
    }
  },
  // Optimizaciones de CSS
  css: {
    devSourcemap: false
  }
})
