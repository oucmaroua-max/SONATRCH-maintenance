import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appRoot = fileURLToPath(new URL('./Sonatrach-bolt-main', import.meta.url));

export default defineConfig({
  root: appRoot,
  publicDir: path.join(appRoot, 'public'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(appRoot, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Bind IPv4 explicitly: on this Windows setup Vite's default "localhost"
    // only listens on [::1], so http://127.0.0.1:5173 is refused.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
});
