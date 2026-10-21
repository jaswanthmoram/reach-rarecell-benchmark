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
  build: {
    rolldownOptions: {
      output: {
        // GSAP in its own cached chunk, not merged into whichever page chunk first imports it. React is its own group,
        // tried first: a group also captures its modules' dependencies, so without it React (via @gsap/react) landed in
        // the gsap chunk and every route had to load GSAP before first render.
        codeSplitting: {
          groups: [
            { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 2 },
            { name: 'gsap', test: /[\\/]node_modules[\\/](gsap|@gsap)[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
})
