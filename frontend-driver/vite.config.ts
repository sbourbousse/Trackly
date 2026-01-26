import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        // Compatibilité Svelte 5
        runes: true
      }
    })
  ],
  server: {
    port: 5175
  },
  publicDir: 'static',
  build: {
    outDir: 'dist'
  }
});
