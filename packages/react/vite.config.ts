import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * @description Vite lib：ESM + UMD，外置 react / vanilla / core
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CronZenReact',
      fileName: 'cron-zen-react',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@cron-zen/core', '@cron-zen/vanilla'],
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@cron-zen/core': 'CronZenCore',
          '@cron-zen/vanilla': 'CronZenVanilla',
        },
        assetFileNames: 'cron-zen-react.[ext]',
      },
    },
    cssCodeSplit: false,
  },
});
