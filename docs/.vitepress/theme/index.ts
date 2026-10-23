import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import PlaygroundEmbed from './components/PlaygroundEmbed.vue';
import './custom.css';

/**
 * @description VitePress theme extension: brand styles + playground embed.
 * @example
 * // loaded automatically by VitePress from .vitepress/theme
 */
const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PlaygroundEmbed', PlaygroundEmbed);
  },
};

export default theme;
