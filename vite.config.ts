import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isElectron = mode === 'electron';
    
    return {
      base: isElectron ? './' : '/',
      build: isElectron ? {
        outDir: 'dist',
        assetsDir: '.',
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html')
          }
        }
      } : {},
      server: {
        port: 5173,
        strictPort: true,
      },
      envPrefix: ['VITE_'],
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
