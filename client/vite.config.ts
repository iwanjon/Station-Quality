// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   server: {
//     host: true, // supaya bisa diakses dari luar container
//     watch: {
//       usePolling: true,
//       interval: 100, // cek perubahan setiap 100ms
//     },
//   },
// })

////////////////////////////////////////////////////////////////////////////////


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   server: {
//     host: true, // supaya bisa diakses dari luar container
//     watch: {
//       usePolling: true,
//       interval: 100, // cek perubahan setiap 100ms
//     },
//   },
//   build: {
//     // Optional: Naikkan sedikit limit warning ke 600kB agar lebih toleran
//     chunkSizeWarningLimit: 600, 
//     rollupOptions: {
//       output: {
//         manualChunks(id) {
//           if (id.includes('node_modules')) {
//             // Memisahkan library yang berat ke dalam file (chunk) terpisah
//             if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-leaflet';
//             if (id.includes('recharts')) return 'vendor-recharts';
//             if (id.includes('@tanstack')) return 'vendor-tanstack';
//             if (id.includes('lucide-react')) return 'vendor-lucide';
//             if (id.includes('axios')) return 'vendor-axios';
//             if (id.includes('dayjs')) return 'vendor-dayjs';
            
//             // Sisa library lainnya akan digabungkan di 'vendor' umum
//             return 'vendor';
//           }
//         }
//       }
//     }
//   }
// })



////////////////////////////////////////////////////////////////

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   server: {
//     host: true, // supaya bisa diakses dari luar container
//     watch: {
//       usePolling: true,
//       interval: 100, // cek perubahan setiap 100ms
//     },
//   },
//   build: {
//     // Naikkan limit warning ke 800kB karena library seperti framer-motion & recharts memang besar secara bawaan
//     chunkSizeWarningLimit: 800, 
//     rollupOptions: {
//       output: {
//         manualChunks(id) {
//           if (id.includes('node_modules')) {
//             // 1. Core React Ecosystem (Sangat besar jika digabung)
//             if (
//               id.includes('/node_modules/react/') || 
//               id.includes('/node_modules/react-dom/') || 
//               id.includes('/node_modules/react-router-dom/')
//             ) {
//               return 'vendor-react-core';
//             }

//             // 2. Heavy Animation & Charting Libraries (Biang kerok ukuran besar)
//             if (id.includes('framer-motion')) return 'vendor-framer-motion';
//             if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-chartjs';
//             if (id.includes('recharts')) return 'vendor-recharts';

//             // 3. Mapping & Data Tables
//             if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-leaflet';
//             if (id.includes('@tanstack')) return 'vendor-tanstack';

//             // 4. Heavy UI Components
//             if (id.includes('react-select')) return 'vendor-react-select';
//             if (id.includes('@heroicons') || id.includes('lucide-react')) return 'vendor-icons';

//             // 5. Utilities
//             if (id.includes('axios')) return 'vendor-axios';
//             if (id.includes('dayjs')) return 'vendor-dayjs';
//             if (id.includes('keen-slider')) return 'vendor-keen-slider';
            
//             // Sisa library lainnya akan digabungkan di 'vendor' umum
//             return 'vendor';
//           }
//         }
//       }
//     }
//   }
// })


///////////////////////////////////////////////////


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
  build: {
    chunkSizeWarningLimit: 800, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. Heavy Animation & Charting Libraries (Safe to split)
            if (id.includes('framer-motion')) return 'vendor-framer-motion';
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-chartjs';
            if (id.includes('recharts')) return 'vendor-recharts';

            // 2. Mapping & Data Tables (Safe to split)
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'vendor-leaflet';
            if (id.includes('@tanstack')) return 'vendor-tanstack';

            // 3. Heavy UI Components (Safe to split)
            if (id.includes('react-select')) return 'vendor-react-select';
            if (id.includes('@heroicons') || id.includes('lucide-react')) return 'vendor-icons';

            // 4. Utilities
            if (id.includes('axios')) return 'vendor-axios';
            if (id.includes('dayjs')) return 'vendor-dayjs';
            if (id.includes('keen-slider')) return 'vendor-keen-slider';
            
            // Do NOT explicitly split React core. Let Vite handle it automatically.
          }
        }
      }
    }
  }
})