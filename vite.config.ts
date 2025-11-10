
import { defineConfig } from 'vite'
export default defineConfig({
  base: '',
  logLevel: 'info',
  build: { target: 'es2022', sourcemap: true },
  worker: { format: 'es' },
  define: { 'process.env': {}, 'global': {} },
})
