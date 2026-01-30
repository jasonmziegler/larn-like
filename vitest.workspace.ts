import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/web/vite.config.ts',
  'packages/shared/vitest.config.ts',
]);
