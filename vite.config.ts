import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
  // Phaser's physics and rendering need proper build handling.
  // Ensure Phaser's globals and asset paths work in production.
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Keep Phaser in its own chunk — it's large and rarely changes.
        manualChunks(id: string) {
          if (id.includes('node_modules/phaser')) {
            return 'phaser';
          }
        },
      },
    },
  },
  // Phaser uses some APIs that need proper optimization handling.
  optimizeDeps: {
    include: ['phaser'],
  },
});
