import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Pecah library vendor besar ke chunk statis terpisah agar:
        // 1) Chunk utama (kode aplikasi) lebih kecil & lebih cepat di-parse
        // 2) Cache browser lebih efektif (react/supabase jarang berubah)
        // Catatan: pdf-lib & react-quill-new sengaja TIDAK dimasukkan — keduanya
        // sudah dipecah via dynamic import (chunk lazy).
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
              priority: 20,
            },
            {
              name: 'supabase',
              test: /node_modules[\\/]@supabase[\\/]/,
              priority: 15,
            },
          ],
        },
      },
    },
  },
})
