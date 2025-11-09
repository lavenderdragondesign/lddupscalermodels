import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // subdomain-friendly (e.g., upscale.lddtools.lol)
  build: { target: 'es2020' }
})
