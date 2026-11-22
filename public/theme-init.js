// Applies the colour theme before the first paint to avoid a flash of the wrong theme.
// Kept as a tiny external file because the Content-Security-Policy forbids inline scripts.
// Must stay in sync with src/theme/theme.ts.
(function () {
  var theme;
  try {
    theme = localStorage.getItem('lifetimeline.theme');
  } catch (e) {
    theme = null;
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
