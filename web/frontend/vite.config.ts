import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@chatbox/shared': path.resolve(__dirname, '../../src/shared'),
      '@chatbox/renderer': path.resolve(__dirname, '../../src/renderer'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  server: {
    port: 5180,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/apps': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
})
