import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'purge-redirects',
        buildStart() {
          const targets = [
            path.resolve(process.cwd(), 'public/_redirects'),
            path.resolve(process.cwd(), '_redirects'),
            path.resolve(__dirname, 'public/_redirects'),
          ];
          targets.forEach((p) => {
            if (fs.existsSync(p)) {
              try { fs.unlinkSync(p); } catch (_) {}
            }
          });
        },
        closeBundle() {
          const targets = [
            path.resolve(process.cwd(), 'dist/_redirects'),
            path.resolve(process.cwd(), 'public/_redirects'),
            path.resolve(__dirname, 'dist/_redirects'),
          ];
          targets.forEach((p) => {
            if (fs.existsSync(p)) {
              try { fs.unlinkSync(p); } catch (_) {}
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
