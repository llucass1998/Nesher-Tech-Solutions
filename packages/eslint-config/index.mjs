import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'dist/**',
    '.next/**',
    'coverage/**',
    'generated/**',
    'src/generated/**',
  ]),
]);
