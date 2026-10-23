# @cron-zen/vanilla

无框架 Cron 可视化编辑器。基于 `@cron-zen/core`，用纯 DOM 挂载，**不依赖 Vue / React**。TS 源码，产物为 ESM + CJS（JS 可直接用）。

文档：[API · vanilla](https://jaskon-io.github.io/cron-zen/api/vanilla) · [选哪个包](https://jaskon-io.github.io/cron-zen/guide/choose-package)

## Install

```bash
pnpm add @cron-zen/vanilla @cron-zen/core
```

### 纯 HTML · `<script>` 直引（无需打包）

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla/dist/cron-zen-vanilla.css" />
<script src="https://cdn.jsdelivr.net/npm/@cron-zen/vanilla/dist/cron-zen-vanilla.browser.js"></script>
<script>
  CronZen.mountCronZen('#app', {
    value: '',
    onChange: function (expr) { console.log(expr); },
  });
</script>
```

全局对象：`window.CronZen`（`mountCronZen` / `createCronZen` / `parseCron` …）。browser 包已内联 `@cron-zen/core`。

### 打包器 · ESM

```js
import { mountCronZen } from '@cron-zen/vanilla';
import '@cron-zen/vanilla/style.css';

const api = mountCronZen('#app', {
  value: '',
  onChange: (expr) => console.log(expr),
});
```

## API

| 导出 | 说明 |
| --- | --- |
| `mountCronZen(el, opts)` | 挂载完整编辑器 |
| `createCronZen(opts)` | 无头状态机（自绘 UI） |

```ts
const api = mountCronZen(document.getElementById('cron')!, {
  value: '0 0 9 * * ?',
  showPreview: true,
  debounceMs: 0,
});

api.getValue();
api.setValue('0 0/5 * * * ?');
api.destroy();
```

## License

MIT
