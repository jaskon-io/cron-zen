# 在线 Playground

<p class="cz-lead">
与仓库 <code>pnpm dev</code> 同源的 Vue 3 演示。可点选字段，观察表达式与近 N 次预览。
</p>

<PlaygroundEmbed />

::: tip
- Playground 是 **Vue 3** 演示应用（体积偏大，含 Element 演示依赖）。  
- 若 iframe 长时间空白，点「新窗口打开」。  
- 无 Vue 环境请用 [`@cron-zen/core`](/api/core)，不要期望在纯 HTML 里直接挂本演示。
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
