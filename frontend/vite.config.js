import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/auth': {
        target: 'http://localhost:9180',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:9180',
        changeOrigin: true,
        secure: false
      }
    }
  }
})