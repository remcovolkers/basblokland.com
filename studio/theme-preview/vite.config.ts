import { defineConfig } from 'vite';

// Standalone harness for the theme preview. Not used by the Studio itself.
export default defineConfig({
  root: import.meta.dirname,
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5199 },
});
