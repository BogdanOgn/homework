import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    root: '.',
  },
  resolve: {
    alias: {
      '@auth': resolve(root, 'src/auth'),
      '@common': resolve(root, 'src/common'),
      '@configs': resolve(root, 'src/configs'),
      '@features': resolve(root, 'src/features'),
      '@generated': resolve(root, 'src/generated'),
    },
  },
});
