/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { CSP_META_TAG } from './src/security/csp.ts';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/** Adds the Content-Security-Policy to the production index.html (see src/security/csp.ts). */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'lifetimeline-csp',
    apply: 'build',
    transformIndexHtml: (html) => html.replace('<head>', `<head>\n    ${CSP_META_TAG}`),
  };
}

// Static build for GitHub Pages: https://tentts.github.io/LifeTimeline/
// No server is involved at runtime — `npm run build` emits plain HTML/JS/CSS into dist/.
export default defineConfig({
  base: '/LifeTimeline/',
  plugins: [react(), contentSecurityPolicy()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
