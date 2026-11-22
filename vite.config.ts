/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static build for GitHub Pages: https://tentts.github.io/LifeTimeline/
// No server is involved at runtime — `npm run build` emits plain HTML/JS/CSS into dist/.
export default defineConfig({
  base: '/LifeTimeline/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
