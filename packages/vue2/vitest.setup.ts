/**
 * @description 强制 vue-template-compiler / @vue/test-utils 解析到本包 Vue 2.7，
 * 避免 monorepo 中 @cron-zen/vue3 的 Vue 3 触发版本 mismatch。
 */
import Module from 'node:module';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const vue2Root = dirname(require.resolve('vue/package.json'));
const vue2Entry = join(vue2Root, 'dist/vue.runtime.common.js');

const mod = Module as typeof Module & {
  _resolveFilename: (
    request: string,
    parent: NodeModule | null,
    isMain: boolean,
    options?: unknown,
  ) => string;
};

const originalResolve = mod._resolveFilename;
mod._resolveFilename = function (
  request: string,
  parent: NodeModule | null,
  isMain: boolean,
  options?: unknown,
): string {
  if (
    request === 'vue' &&
    parent?.filename &&
    (parent.filename.includes('vue-template-compiler') ||
      parent.filename.includes('@vue/test-utils'))
  ) {
    return vue2Entry;
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

void fileURLToPath;
