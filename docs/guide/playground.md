# 在线 Playground

<p class="cz-lead">
与仓库 <code>pnpm dev</code> 同源的 Vue 3 演示：完整编辑器可试用<strong>常用模板</strong>与<strong>近 N 次 / 近 N 次已触发</strong>；下方为 Element Picker 弹窗示例。
</p>

<PlaygroundEmbed />

::: tip
- Playground 是 **Vue 3** 演示（体积偏大，含 Element Plus）。  
- 页首「完整编辑器」可见模板下拉与 prevRuns；Picker 弹窗内 `showPreview=false`，以配置为主。  
- 若 iframe 长时间空白，点「新窗口打开」。  
- 无 Vue 请用 [`@cron-zen/vanilla`](/api/vanilla) 或 [`@cron-zen/core`](/api/core)。
:::

## 本地运行

```bash
pnpm install
pnpm dev
# → http://localhost:5173
```

## 说明

- Playground 仅用于演示，不代表默认集成路径必须安装 Element Plus。
- 生产嵌入请优先 [快速开始](./quick-start) 与 [任意 UI 库集成](./any-ui)。
