import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for better performance
    minify: 'esbuild', // Minify for production
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'], // Separate vendor chunks
          router: ['react-router-dom'] // Separate router chunk
        }
      }
    }
  },
  // Base path for production deployment (important for GitHub Pages, Vercel, etc.)
  base: './',
  // Preview server configuration
  preview: {
    port: 4173,
    host: true
  }
})
