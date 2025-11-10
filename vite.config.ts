
import { defineConfig } from 'vite'

export default defineConfig({
  logLevel: 'info',
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return
        warn(warning)
      },
    },
  },
  worker: {
    format: 'es',
  },
  define: {
    'process.env': {},
    'global': {},
  },
})
