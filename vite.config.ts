import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: process.env.PAGES_BASE_PATH || '/',
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**', '.worktrees/**'],
  },
})
