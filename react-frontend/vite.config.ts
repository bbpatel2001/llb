import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// The Vite app is the canonical frontend. It proxies API requests so the
// browser never needs to call Chrome's blocked port 6000 directly.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 6001,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:6000',
          changeOrigin: true,
        },
      },
    },
  }
})
