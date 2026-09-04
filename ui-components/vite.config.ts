import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        triage: resolve(__dirname, 'triage.html'),
        hydration: resolve(__dirname, 'hydration.html'),
        posture: resolve(__dirname, 'posture.html'),
        stretches: resolve(__dirname, 'stretches.html'),
      },
    },
  },
});
