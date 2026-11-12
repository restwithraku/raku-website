import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every asset path relative, so the same build works on a
// GitHub Pages project address (username.github.io/raku-website/) and on a custom domain.
// The local site always runs on http://localhost:5190; strictPort stops it moving to another port.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5190, strictPort: true },
  preview: { port: 5190, strictPort: true }
});
