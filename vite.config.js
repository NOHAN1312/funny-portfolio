import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: './',
  build: {
    rollupOptions: {
      // The butterflies effect library is loaded lazily from a CDN at runtime
      // (see src/Butterflies.jsx), so keep it out of the bundle graph.
      external: [/^https?:\/\//],
    },
  },
})
