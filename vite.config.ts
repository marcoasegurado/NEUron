import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'
import { defineConfig } from 'vitest/config'

const apiTarget = process.env.NEURON_API_PROXY

function apiProxy(): Record<string, ProxyOptions> | undefined {
  if (!apiTarget) {
    return undefined
  }

  return {
    '/api': {
      target: apiTarget,
      changeOrigin: true,
      secure: true,
      configure(proxy) {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.setHeader('Origin', apiTarget)
          proxyReq.setHeader('Referer', `${apiTarget}/`)
        })
        proxy.on('proxyRes', (proxyRes) => {
          const cookies = proxyRes.headers['set-cookie']
          if (cookies) {
            const values = Array.isArray(cookies) ? cookies : [cookies]
            proxyRes.headers['set-cookie'] = values.map((cookie) =>
              cookie.replace(/;\s*Secure/gi, ''),
            )
          }
        })
      },
    },
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: apiProxy(),
  },
  preview: {
    proxy: apiProxy(),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // jsdom startup plus user-event typing is slow on low-core machines, and
    // an environment setup can take several seconds per file. The default 5s
    // ceiling produced load-dependent failures in the setup flow; 20s only
    // raises the ceiling and does not change how quickly a test finishes.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
