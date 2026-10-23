import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { h } from 'vue';
import HomeBadges from './components/HomeBadges.vue';
import PlaygroundEmbed from './components/PlaygroundEmbed.vue';
import CronZenBusinessDemo from './components/CronZenBusinessDemo.vue';
import PackageDemoLinks from './components/PackageDemoLinks.vue';
import './custom.css';

/**
 * @description VitePress theme：徽章、业务弹层 Demo、各包 Demo 入口（无 iframe）
 * @example
 * // loaded automatically by VitePress from .vitepress/theme
 */
const theme: Theme = {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-actions-after': () => h(HomeBadges),
    });
  },
  enhanceApp({ app }) {
    app.component('PlaygroundEmbed', PlaygroundEmbed);
    app.component('CronZenBusinessDemo', CronZenBusinessDemo);
    app.component('PackageDemoLinks', PackageDemoLinks);
  },
};

export default theme;
