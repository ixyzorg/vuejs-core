import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@vue/shared': fileURLToPath(new URL('./packages/shared/src', import.meta.url)),
      '@vue/reactivity': fileURLToPath(
        new URL('./packages/reactivity/src', import.meta.url),
      ),
    },
  },
})
