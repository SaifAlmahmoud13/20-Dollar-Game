import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative paths so the site works from a sub-folder (GitHub Pages serves it at /20-Dollar-Game/).
  base: './',
});
