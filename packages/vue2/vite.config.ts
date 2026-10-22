import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue2';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      vue: resolve(__dirname, 'node_modules/vue/dist/vue.runtime.esm.js'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CronZenVue2',
      fileName: (format) =>
        format === 'es' ? 'cron-zen-vue2.mjs' : 'cron-zen-vue2.umd.cjs',
    },
    rollupOptions: {
      external: ['vue', '@cron-zen/core'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          '@cron-zen/core': 'CronZenCore',
        },
        assetFileNames: 'cron-zen-vue2.[ext]',
      },
    },
    cssCodeSplit: false,
  },
});
