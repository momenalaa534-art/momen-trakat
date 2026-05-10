import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (id.includes('/firebase/') || id.includes('/@firebase/')) {
              return 'vendor-firebase';
            }

            if (id.includes('/@google/genai/')) {
              return 'vendor-ai';
            }

            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor-react';
            }

            if (id.includes('/motion/') || id.includes('/framer-motion/')) {
              return 'vendor-motion';
            }

            if (id.includes('/lucide-react/')) {
              return 'vendor-icons';
            }

            if (id.includes('/adhan/')) {
              return 'vendor-prayer';
            }

            if (id.includes('/html-to-image/') || id.includes('/html2canvas/') || id.includes('/canvas-confetti/')) {
              return 'vendor-media';
            }

            return 'vendor';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
