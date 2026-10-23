import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { h } from 'vue';
import HomeBadges from './components/HomeBadges.vue';
import PlaygroundEmbed from './components/PlaygroundEmbed.vue';
import './custom.css';

/**
 * @description VitePress theme: brand styles, hero badges, playground embed.
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
  },
};

export default theme;
