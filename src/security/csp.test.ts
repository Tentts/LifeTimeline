import { CSP, CSP_DIRECTIVES } from './csp';

describe('Content-Security-Policy', () => {
  it('blocks every way of sending data over the network', () => {
    expect(CSP_DIRECTIVES['connect-src']).toEqual(["'none'"]);
    expect(CSP_DIRECTIVES['form-action']).toEqual(["'none'"]);
    expect(CSP_DIRECTIVES['default-src']).toEqual(["'self'"]);
  });

  it('allows no remote hosts at all', () => {
    const allowed = Object.values(CSP_DIRECTIVES).flat();
    const remote = allowed.filter(
      (source) => /^(https?:|wss?:|\*|\/\/)/.test(source) || source.includes('.'),
    );
    expect(remote).toEqual([]);
  });

  it('does not allow inline or eval scripts', () => {
    expect(CSP_DIRECTIVES['script-src']).toEqual(["'self'"]);
    expect(CSP).not.toMatch(/unsafe-eval/);
  });
});
