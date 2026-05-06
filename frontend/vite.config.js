import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const gatewayTarget = process.env.VITE_GATEWAY_PROXY_TARGET ?? 'http://localhost'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/auth': {
        target: gatewayTarget,
        changeOrigin: true,
      },
      '/tenant': {
        target: gatewayTarget,
        changeOrigin: true,
      },
      '/catalog': {
        target: gatewayTarget,
        changeOrigin: true,
      },
      '/health': {
        target: gatewayTarget,
        changeOrigin: true,
      },
    },
  },
})
