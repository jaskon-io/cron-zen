import { defineConfig } from 'vitepress';

/**
 * @description VitePress site config for cron-zen docs (GitHub Pages).
 * @example
 * pnpm --filter @cron-zen/docs dev
 */
export default defineConfig({
  title: 'cron-zen',
  description: '可嵌入的 Cron 引擎：纯 TS 核心，不绑 UI 库，Vue 适配可选',
  lang: 'zh-CN',
  // Project site: https://jaskon-io.github.io/cron-zen/
  base: '/cron-zen/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', href: '/cron-zen/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0f766e' }],
  ],
  themeConfig: {
    logo: { src: '/logo.svg', alt: 'cron-zen' },
    siteTitle: 'cron-zen',
    nav: [
      { text: '指南', link: '/guide/introduction' },
      { text: '任意 UI', link: '/guide/any-ui' },
      { text: 'API', link: '/api/core' },
      { text: 'Playground', link: '/guide/playground' },
      {
        text: 'npm',
        items: [
          { text: '@cron-zen/core', link: 'https://www.npmjs.com/package/@cron-zen/core' },
          { text: '@cron-zen/vue3', link: 'https://www.npmjs.com/package/@cron-zen/vue3' },
        ],
      },
      { text: 'GitHub', link: 'https://github.com/jaskon-io/cron-zen' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '快速开始', link: '/guide/quick-start' },
            { text: '任意 UI 库集成', link: '/guide/any-ui' },
            { text: '与 cron.ren 的差异', link: '/guide/vs-cron-ren' },
            { text: '在线 Playground', link: '/guide/playground' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API',
          items: [
            { text: '@cron-zen/core', link: '/api/core' },
            { text: '@cron-zen/vue3', link: '/api/vue3' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/jaskon-io/cron-zen' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © cron-zen contributors',
    },
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/jaskon-io/cron-zen/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
  },
});
