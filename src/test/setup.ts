import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import '../i18n';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
