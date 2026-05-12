import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'WEBSHOP_', 'AUTH_'],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 4173,
  },
})
