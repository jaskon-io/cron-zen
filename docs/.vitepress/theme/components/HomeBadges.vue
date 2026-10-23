<script setup lang="ts">
/**
 * @description Compact trust badges under the home hero actions (no star count).
 */
const badges = [
  {
    href: 'https://www.npmjs.com/package/@cron-zen/core',
    src: 'https://img.shields.io/npm/v/@cron-zen/core.svg?label=%40cron-zen%2Fcore',
    alt: '@cron-zen/core version',
  },
  {
    href: 'https://www.npmjs.com/package/@cron-zen/vue3',
    src: 'https://img.shields.io/npm/v/@cron-zen/vue3.svg?label=%40cron-zen%2Fvue3',
    alt: '@cron-zen/vue3 version',
  },
  {
    href: 'https://github.com/jaskon-io/cron-zen/blob/main/LICENSE',
    src: 'https://img.shields.io/npm/l/@cron-zen/core.svg',
    alt: 'MIT license',
  },
] as const;
</script>

<template>
  <div class="cz-hero-badges">
    <a
      v-for="b in badges"
      :key="b.href"
      :href="b.href"
      target="_blank"
      rel="noopener"
    >
      <img :src="b.src" :alt="b.alt" />
    </a>
  </div>
</template>

<style scoped>
.cz-hero-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 8px;
  margin-top: 18px;
}

.cz-hero-badges img {
  display: block;
  height: 20px;
}

@media (min-width: 960px) {
  .cz-hero-badges {
    justify-content: flex-start;
  }
}
</style>
