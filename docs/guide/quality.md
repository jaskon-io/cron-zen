# 质量与安全

<p class="cz-lead">
cron-zen 面向可嵌入业务表单：行为要对、性能要稳、异常输入不能拖垮页面。本节说明我们如何保证——以及你接入时要注意什么。
</p>

## 测试矩阵（持续维护）

| 包 | 覆盖重点 | 量级（约） |
| --- | --- | --- |
| `@cron-zen/core` | 解析 / 生成 / 校验 / 近 N 次 / 时区 / i18n / 压测 / 韧性 | 200+ cases |
| `@cron-zen/vue3` | 组件交互、回显、日周互斥、压测、XSS 边界、卸载清理 | 290+ |
| `@cron-zen/vue2` | 与 vue3 对齐的状态机 + 组件 / 压测 / 韧性 | 39+ |
| `@cron-zen/vanilla` | `createCronZen` / `mount` / 压测 | 24+ |

本地：

```bash
pnpm test
```

发版前各包 `prepublishOnly` 会跑 **typecheck → test → build**。

## 功能正确性

- **Quartz / cron.ren 主路径**：年可省略、日周互斥、`L` / `LW` / `nW`、周 `nL` / `#`、倒序区间回绕等有单测锁定。
- **空 v-model**：不偷偷注入默认表达式，避免「清空表单却写回 `* * * * * ?`」。
- **时区**：`getNextRuns` / `formatRunTime` 可传 IANA；非法时区回退本地，不抛崩。
- **i18n**：`describeCron` / `getCronTabs` 支持 `zh-CN` / `en-US`。

## 性能

| 手段 | 说明 |
| --- | --- |
| 近 N 次条数夹紧 | `nextCount` ≤ 100 |
| 防抖写回 | `debounceMs` ≤ 5000；预览可即时、v-model 可防抖 |
| 近 N 次延后 | 输入路径微延迟，避免每次按键全量扫日历 |
| 字段格子上限 | ValueGrid ≤ 120 格，防止超大区间撑爆 DOM |
| 展开跨度上限 | core 展开单字段有上限，防恶意 min/max |

压测用例要求：连续上百次字段更新在合理毫秒内完成且不抛错。

## 内存与泄漏

- 适配层在 **unmount / `destroy()`** 时清理防抖定时器与近 N 次定时器。
- `vanilla`：务必在页面销毁时调用 `api.destroy()`。
- Vue：组件卸载走 `onBeforeUnmount` / `beforeDestroy`，单测覆盖「卸载后不再写回」。

## 安全边界

| 风险 | 处理 |
| --- | --- |
| 超长 / 乱码表达式 | 解析失败；过长输入不回写进预览表达式 |
| HTML / 脚本片段 | 含 `<>` 等非法字符拒绝；不插入可执行 DOM |
| `%` 等调度特殊字符 | core 层转义约定，避免后端解析翻车 |
| prototype 污染式字段值 | 生成路径吞掉异常，不抛未捕获错误 |

::: warning 仍需业务侧配合
cron-zen 是**配置器**，不是权限系统。最终下发到调度中枢前，请在服务端再做校验与鉴权。
:::

## 业务嵌入建议

1. **选对包**：[选哪个包](./choose-package)（无 Vue → vanilla，Vue2 → vue2，Vue3 → vue3）。
2. **弹窗场景**：`showPreview=false`，减轻 DOM 与近 N 次计算。
3. **时区**：调度按业务时区传 `timeZone`，不要默认「本机时区 = 机房时区」。
4. **销毁**：SPA 路由离开 / 弹窗关闭时销毁实例或依赖 Vue 卸载。
5. **引入**：JS / TS、`import` / `require` 见 [引入方式](./import-styles)。

## 版本与变更

正式变更记在仓库 [CHANGELOG](https://github.com/jaskon-io/cron-zen/blob/main/CHANGELOG.md) 与 [Releases](https://github.com/jaskon-io/cron-zen/releases)。
