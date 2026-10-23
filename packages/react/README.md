# @cron-zen/react

React **18 / 19** Cron 可视化编辑器。薄封装 [`@cron-zen/vanilla`](https://www.npmjs.com/package/@cron-zen/vanilla)（`mountCronZen`），默认语言 **`zh-CN`**。

文档：[API · react](https://jaskon-io.github.io/cron-zen/api/react) · [选哪个包](https://jaskon-io.github.io/cron-zen/guide/choose-package)

## Install

```bash
pnpm add @cron-zen/react @cron-zen/vanilla @cron-zen/core react react-dom
```

`peerDependencies`：`react` / `react-dom` → `^18 || ^19`。

## Usage

```tsx
import { useState } from 'react'
import { CronZen } from '@cron-zen/react'
import '@cron-zen/react/style.css'

export function App() {
  const [cron, setCron] = useState('')
  return (
    <CronZen
      value={cron}
      onChange={(expr) => setCron(expr)}
      locale="zh-CN"
      timeZone="Asia/Shanghai"
    />
  )
}
```

英文 UI：`locale="en-US"`。

无头状态（不要可视化）可用 `useCronZen`；或直接用 `createCronZen` / `mountCronZen`（从本包或 `@cron-zen/vanilla` 再导出）。

## License

MIT
