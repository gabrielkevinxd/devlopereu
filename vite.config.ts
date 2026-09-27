import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Runtime: Preact (API React via preact/compat, ~10 kB) — o código continua escrito em React/TS.
// Build em 3 passos (ver package.json): cliente → SSR → scripts/prerender.mjs gera HTML estático por idioma.
export default defineConfig({
  plugins: [preact()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
  server: {
    port: 5173,
    host: true,
  },
});
