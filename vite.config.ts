/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 2600,
    rollupOptions: {
      output: {
        manualChunks: {
          'ag-grid-vendor': ['ag-grid-community', 'ag-grid-enterprise', 'ag-grid-vue3'],
          'vue-vendor': ['vue']
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: true
  }
})
