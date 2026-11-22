// Fails the build if dist/index.html is missing the Content-Security-Policy that
// stops the app from sending data anywhere. Run automatically after `vite build`.
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const match = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);

if (!match) {
  console.error('✗ dist/index.html has no Content-Security-Policy meta tag.');
  process.exit(1);
}
if (!/(^|;\s*)connect-src 'none'(;|$)/.test(match[1])) {
  console.error(`✗ CSP does not contain connect-src 'none':\n  ${match[1]}`);
  process.exit(1);
}
console.log("✓ CSP present with connect-src 'none'");
