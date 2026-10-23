import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * @description 浏览器单文件 IIFE：内联 @cron-zen/core，供 `<script src>` 直引（无打包器）
 * @example
 * <script src="cron-zen-vanilla.browser.js"></script>
 * <script>CronZen.mountCronZen('#app', { value: '' })</script>
 */
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CronZen',
      formats: ['iife'],
      fileName: () => 'cron-zen-vanilla.browser.js',
    },
    rollupOptions: {
      // 不 external core：打进同一文件，HTML 只引一次
      output: {
        exports: 'named',
        assetFileNames: 'cron-zen-vanilla.[ext]',
        // IIFE 挂到 window.CronZen
        extend: true,
      },
    },
    cssCodeSplit: false,
    minify: true,
  },
});
