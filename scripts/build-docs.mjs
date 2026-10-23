#!/usr/bin/env node
/**
 * @description Build VitePress docs and copy playground into /playground for GitHub Pages.
 * @example node scripts/build-docs.mjs
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @description Run a command in the monorepo root; exit on failure.
 * @param {string} command
 * @param {string[]} args
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {void}
 */
function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('pnpm', ['--filter', '@cron-zen/docs', 'build']);
run('pnpm', ['--filter', '@cron-zen/playground', 'build'], {
  PLAYGROUND_BASE: '/cron-zen/playground/',
});

const playgroundDist = resolve(root, 'apps/playground/dist');
const dest = resolve(root, 'docs/.vitepress/dist/playground');

if (!existsSync(playgroundDist)) {
  console.error('[build-docs] playground dist missing:', playgroundDist);
  process.exit(1);
}

if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}
cpSync(playgroundDist, dest, { recursive: true });
console.log('[build-docs] playground copied →', dest);
