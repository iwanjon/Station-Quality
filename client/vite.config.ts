import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // supaya bisa diakses dari luar container
    watch: {
      usePolling: true,
      interval: 100, // cek perubahan setiap 100ms
    },
  },
})
