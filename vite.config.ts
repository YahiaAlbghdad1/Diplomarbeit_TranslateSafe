import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');

  // Get the API key from various possible environment variable names
  const apiKey = env.API_KEY || env.GEMINI_API_KEY || env.VITE_API_KEY || env.VITE_GEMINI_API_KEY;

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: {
        clientPort: 443, // vital for the preview to work over https
      }
    },
    plugins: [react()],
    define: {
      // Vital: Replace 'process.env.API_KEY' in the code with the actual string value
      'process.env.API_KEY': JSON.stringify(apiKey || ""),
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
      }
    },
    optimizeDeps: {
      exclude: ['whatwg-fetch']
    }
  }
})