import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Base path: '/' locally; the GitHub Pages workflow sets VITE_BASE=/<repo>/ for project pages.
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      // SPA fallback for static hosts (GitHub Pages serves 404.html for unknown routes).
      name: 'spa-404-fallback',
      closeBundle() {
        const dist = path.resolve('dist');
        const index = path.join(dist, 'index.html');
        if (fs.existsSync(index)) {
          fs.copyFileSync(index, path.join(dist, '404.html'));
          fs.writeFileSync(path.join(dist, '.nojekyll'), '');
        }
      },
    },
  ],
});
