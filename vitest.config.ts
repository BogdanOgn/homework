import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const root = import.meta.dirname;
const userServiceSrc = resolve(root, 'apps/user-service/src');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/**/src/**/*.spec.ts'],
    root: '.',
  },
  resolve: {
    alias: {
      '@auth': resolve(userServiceSrc, 'auth'),
      '@common': resolve(userServiceSrc, 'common'),
      '@configs': resolve(userServiceSrc, 'configs'),
      '@features': resolve(userServiceSrc, 'features'),
      '@generated': resolve(userServiceSrc, 'generated'),
      '@providers': resolve(userServiceSrc, 'providers'),
    },
  },
});
