import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 5173 is Vite's default and clashes with other local projects. strictPort
  // makes Vite stop with an error instead of moving to another port, because
  // run_all.ps1 and the Playwright config expect this one.
  server: { port: 5420, strictPort: true },
})
