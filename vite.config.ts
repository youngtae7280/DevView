import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const openAiApiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/openai': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/openai/, ''),
          ...(openAiApiKey
            ? { headers: { Authorization: `Bearer ${openAiApiKey}` } }
            : {}),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      globals: true,
    },
  }
})
