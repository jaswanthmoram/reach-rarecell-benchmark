import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/reach-rarecell-benchmark/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
