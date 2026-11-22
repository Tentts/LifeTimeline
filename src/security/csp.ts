/**
 * Content-Security-Policy for the production build.
 *
 * This turns our "we never receive your data" promise into something the browser enforces:
 * `connect-src 'none'` blocks fetch/XHR/WebSocket/beacons, `form-action 'none'` blocks form posts,
 * and every other resource must come from our own origin. Exports are downloaded through local
 * blob: URLs, which need no network.
 *
 * It is only injected into the production build, because the Vite dev server needs a WebSocket
 * for hot reload. Guarded by csp.test.ts and scripts/verify-csp.mjs.
 */
export const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  // jsPDF/svg2pdf set inline styles while rendering; this allows no network access.
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'"],
  'connect-src': ["'none'"],
  'form-action': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'frame-src': ["'none'"],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
};

export const CSP = Object.entries(CSP_DIRECTIVES)
  .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
  .join('; ');

export const CSP_META_TAG = `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`;
