import { defineConfig } from 'vitepress';

/**
 * @description VitePress site config for cron-zen docs (GitHub Pages).
 * @example
 * pnpm --filter @cron-zen/docs dev
 */
export default defineConfig({
  title: 'cron-zen',
  description: '可嵌入的 Cron 引擎：纯 TypeScript 核心，不绑定 UI 库，Vue 适配可选',
  lang: 'zh-CN',
  base: '/cron-zen/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', href: '/cron-zen/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#0f766e' }],
    [
      'meta',
      {
        name: 'keywords',
        content: 'cron,quartz,vue,cron-expression,scheduler,cron-zen',
      },
    ],
  ],
  themeConfig: {
    logo: { src: '/logo.svg', alt: 'cron-zen' },
    siteTitle: 'cron-zen',
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    lastUpdated: {
      text: '最后更新',
      formatOptions: { dateStyle: 'medium', timeStyle: 'short' },
    },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '外观',
    nav: [
      {
        text: '指南',
        activeMatch: '/guide/',
        items: [
          { text: '介绍', link: '/guide/introduction' },
          { text: '选哪个包', link: '/guide/choose-package' },
          { text: '快速开始', link: '/guide/quick-start' },
          { text: '任意 UI 库集成', link: '/guide/any-ui' },
          { text: '与 cron.ren 对照', link: '/guide/vs-cron-ren' },
        ],
      },
      {
        text: 'API',
        activeMatch: '/api/',
        items: [
          { text: '@cron-zen/core', link: '/api/core' },
          { text: '@cron-zen/vue3', link: '/api/vue3' },
        ],
      },
      { text: 'Playground', link: '/guide/playground', activeMatch: '/guide/playground' },
      {
        text: '生态',
        items: [
          { text: 'npm · core', link: 'https://www.npmjs.com/package/@cron-zen/core' },
          { text: 'npm · vue3', link: 'https://www.npmjs.com/package/@cron-zen/vue3' },
          { text: 'GitHub', link: 'https://github.com/jaskon-io/cron-zen' },
          {
            text: '更新日志',
            link: 'https://github.com/jaskon-io/cron-zen/blob/main/CHANGELOG.md',
          },
          { text: 'Releases', link: 'https://github.com/jaskon-io/cron-zen/releases' },
        ],
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '选哪个包', link: '/guide/choose-package' },
            { text: '快速开始', link: '/guide/quick-start' },
          ],
        },
        {
          text: '指南',
          items: [
            { text: '任意 UI 库集成', link: '/guide/any-ui' },
            { text: '与 cron.ren 对照', link: '/guide/vs-cron-ren' },
          ],
        },
        {
          text: '示例',
          items: [{ text: '在线 Playground', link: '/guide/playground' }],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
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
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有匹配结果',
            resetButtonTitle: '清除',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },
    editLink: {
      pattern: 'https://github.com/jaskon-io/cron-zen/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },
  },
});
