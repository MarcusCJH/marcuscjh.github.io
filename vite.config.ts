import { defineConfig } from 'vite';
import {
  devSeoRoutesPlugin,
  projectPagesPlugin,
  seoHeadPlugin,
  sitemapPlugin,
  webManifestPlugin,
} from './plugins/index.ts';

export default defineConfig({
  plugins: [
    seoHeadPlugin(),
    webManifestPlugin(),
    sitemapPlugin(),
    projectPagesPlugin(),
    devSeoRoutesPlugin(),
  ],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 4173,
    open: true,
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
