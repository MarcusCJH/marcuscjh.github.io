import { defineConfig } from 'vite'

export default defineConfig({
  base: '/', // GitHub Pages base path
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173,
    open: true
  },
  publicDir: 'public',
  assetsInclude: ['**/*.json'], // Include JSON files as assets
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
