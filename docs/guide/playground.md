# 在线 Playground

下面嵌入本仓库的 Vue 3 Playground（与 `pnpm dev` 同源）。可直接点选字段，观察 Cron 与近 N 次预览。

<iframe
  class="playground-frame"
  src="/cron-zen/playground/"
  title="cron-zen playground"
  loading="lazy"
></iframe>

<p class="playground-actions">
  <a class="VPButton medium brand" href="/cron-zen/playground/" target="_blank" rel="noopener">新窗口打开</a>
</p>

## 本地运行

```bash
pnpm install
pnpm dev
# → http://localhost:5173
```

## 说明

- Playground 依赖 `@cron-zen/vue3` + Element Plus，仅作演示。
- 若 iframe 空白，多半是 GitHub Pages 尚未部署或路径未带 `/cron-zen/` 前缀；可先点「新窗口打开」排查。

<style>
.playground-frame {
  width: 100%;
  height: min(78vh, 880px);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}
.playground-actions {
  margin-top: 12px;
}
</style>
