# static-pi：用 scriptc 静态编译 pi（无 JS 引擎）

## 目标

把 `pi`（coding agent CLI）用 `scriptc` 编译成**100% 静态、不嵌入 quickjs** 的原生二进制。

功能取舍（用户确认）：

- **TUI 交互模式为最高优先级**，print / RPC / JSON event 模式保留，除非实现起来非常麻烦
- **扩展系统完全移除**（不需要任何运行时插件加载能力）
- **模型来源只有三个**，全部走 `openai-completions` API：
  - DeepSeek（`DEEPSEEK_API_KEY`，api.deepseek.com）
  - Xiaomi-MIMO Token Plan CN（`XIAOMI_TOKEN_PLAN_CN_API_KEY`，token-plan-cn.xiaomimimo.com/v1）
  - `~/.pi/agent/models.json` 手动配置（当前是本地 llama.cpp OpenAI 兼容端点）
- **不要图片支持**（photon / terminal image / clipboard image 全砍）

## 分析发现

### scriptc 能力面（对 pi 有利）

- async/await、事件循环（epoll）、Promise 语义与 Node 一致（差异测试保证字节级一致）
- 原生网络栈：net/http/https/tls/dgram/dns + 全局 `fetch`（含 `ReadableStream` body reader、`AbortSignal`）→ 可以裸 fetch + SSE 解析替换 SDK
- `child_process`：spawnSync/execSync 全支持；async `spawn()` 支持 stdout/stderr 管道（字节 data/end）、exit/error、kill/unref/detached/env/cwd。**不支持向子进程写 stdin**（编译围栏）；ChildProcess 没有 `"close"` 事件，流上没有 removeListener/destroy
- `process`：env、stdin raw mode + 字节 data 事件（TUI 输入够用）、SIGINT/exit、`process.kill(-pid)` 杀进程组可用
- 全局 API：structuredClone、TextDecoder、atob/btoa、performance 都有
- **argv 布局**：`argv[1]` 是二进制路径，用户参数从 `argv[2]` 开始（与 Node 对齐）；越界读取会 abort 而不是 undefined
- `import()` 字面量 specifier 会被静态解析进模块图；变量 specifier 不行
- 限制：`any` 无 `--dynamic` 是编译错误（SC2011）；record 必须精确形状（SC2002）；Set/Map 元素只能是 string/number；无 WeakMap/WeakSet/Proxy/Intl.Segmenter lowering；正则 `v` flag、String.replaceAll、Number.parseInt 未 lowering；`==` 宽松比较受限

### pi 代码基线（2026-08-27，scriptc 本地构建）

对 `packages/coding-agent/src/cli.ts` 全图：

| 指标 | 数值 |
|---|---|
| 语句总数 | 6478 |
| 可静态编译 | 5779（**89%**） |
| build 逐点诊断 | 265 个（SC 码 + 文件行号 + 重写提示齐全） |

子包单独跑：pi-ai 90%，TUI 95%。

诊断分布：186 × SC2013（npm 包 import，靠 `--npm-static` 解决）、35 × SC1090、13 × SC2020、12 × SC2011（any）、11 × SC2009（Set/Map/函数值形状）、4 × SC2004（级联）、3 × SC2002、1 × SC2012。

问题最密集的文件：`core/model-config.ts`(42)、`utils/syntax-highlight.ts`(24)、`theme/theme.ts`(12)、`extensions/loader.ts`(12)、`core/http-dispatcher.ts`(9，整个文件待删)、内置工具 `tools/*`（edit 7 / ls 6 / read 5 / grep 5 / find 5 / write 4 / bash 4）。

### 关键墙与对策

1. **扩展系统循环导入（SC1016）**：6 个模块环全部穿过 `extensions/loader.ts` 的顶层可执行代码。临时方案已做（把 4 个运行时探测绑定改为延迟求值，行为不变），正式方案是整体移除扩展系统。
2. **typebox 无法静态编译**（实验验证）：
   - `--npm-static typebox` → preflight 拒绝：`SC1013: namespace re-exports (export * as ns) ... not supported yet`（typebox 入口是 `export * as Type from './typebox.mjs'`）
   - 不启用时 pi 自己的 `Type.Object({...})` 泛型调用撞 SC1090（只有对象字面量里带实现的方法能多态化；typebox builder 是函数声明经 namespace 链导出）
   - 对照实验证明跨模块普通函数、`NS.f()` 形式都能编译，墙就是 typebox 的发布形态
   - **对策（已确认）**：pi 内部写 mini schema 库（builder + JSON-Schema validator，对象字面量方法形态），替换 value 层；typebox 保留为 types-only 依赖（`import type` 不产生运行时边）
3. **provider SDK**：openai/@anthropic-ai/sdk/@google/genai/@aws-sdk 全部砍掉（三个模型来源全走 openai-completions）。`openai-completions.ts` 里对 `openai` SDK 的实际使用只有一处 `client.chat.completions.create(params).withResponse()`，替换为裸 fetch + SSE 解析（~100 行核心改动）
4. **图片管线**：photon.ts 用 monkey-patch fs.readFileSync 加载 WASM → 与静态编译原理冲突，连同 image-resize/worker、terminal-image、clipboard-image 一起移除
5. **其他待删**：undici dispatcher（http-dispatcher.ts，原生 fetch 替代）、node:sqlite backend、bedrock/bun 入口、OAuth 流程、jiti

### 环境备忘

- scriptc 要求 Node 24+；本机系统 node 是 v26（`/usr/bin/node`），pi 的 PATH 里默认 node 是 v22 → 用 `~/bin-node26` shim 目录前置
- scriptc CLI：`node /home/zy/zy/TEST/pi-bin/scriptc/packages/cli/dist/bootstrap.js {build|run|coverage} ...`
- pi 需要先 `npm install --ignore-scripts` + `npm run hydrate:model-data` + `npm run build:offline`（scriptc 走 node_modules 解析 workspace 包，需要 dist）
- scriptc 用固定 compilerOptions（moduleResolution: Bundler），**不读项目 tsconfig 的 paths**；环境声明 .d.ts 需要 `/// <reference>` 才能进模块图
- pi 的类型检查门：`tsgo --noEmit`（@typescript/native-preview）

## 方案（阶段划分）

1. **基线分析** ✅ 完成（本文档 + 上方数字）
2. **移除扩展系统**：删 `core/extensions/`、`src/extensions/`；把内置工具依赖的共享类型（ToolDefinition/ToolRenderContext/ToolRenderResultOptions/defineTool，去掉 ctx 参数）迁到 `core/tools/tool-types.ts`；清理 ~37 个引用文件
3. **mini schema 库**：新模块提供 Type.* builder + Compile/Value 等价物（含 `Symbol.for("TypeBox.Kind")` 元数据兼容），替换 14 个文件 373 处 builder 调用及 validation/model-config/reducer 的 value 层依赖；跨包共享方式待实现时定（倾向放 pi-ai，protocol 单独处理）
4. **openai-completions fetch 化**：砍掉 openai SDK，裸 fetch + SSE 解析（delta/tool_call/usage），provider 注册表裁剪到 deepseek / xiaomi-token-plan-cn / models.json
5. **按 build 诊断清单批量修复**：any → unknown、WeakMap/Set 形状、process.title 赋值删除、import.meta.url → __dirname、fs/promises.access 替换、TUI 的 Segmenter/v-flag/replaceAll、keybindings record 形状等
6. **`--npm-static` 收尾**：yaml/markd/chalk/diff/ignore/minimatch/semver/get-east-asian-width/highlight.js 等逐包验证，外围功能（mermaid/高亮）撞墙即砍
7. **全量构建 + 冒烟**：TUI 交互、bash 工具流式输出、三个模型真跑对话；`scriptc build` 零诊断

## 当前进度

- [x] scriptc 环境搭建（pnpm install + pnpm -r build），hello world 编译链验证
- [x] pi 依赖安装、模型数据 hydration、全 workspace dist 构建
- [x] 基线 coverage/build 全量诊断拿到（6478/5779，265 个逐点诊断）
- [x] typebox 墙的 repro 实验与确认
- [x] 两处分析性小改：syntax-highlight.ts 加 `/// <reference>`；extensions/loader.ts 顶层探测延迟求值
- [ ] 阶段 2 扩展系统移除（进行中）
- [ ] 阶段 3 mini schema 库
- [ ] 阶段 4 openai-completions fetch 化
- [ ] 阶段 5 诊断清单批量修复
- [ ] 阶段 6 --npm-static 收尾
- [ ] 阶段 7 全量构建 + 冒烟

## 风险备注

- `--npm-static` 是实验性特性，剩余 npm 包逐个可能有意外（尤其 marked 18 / highlight.js），外围功能可砍可保
- TUI 的 `Intl.Segmenter`（词/字素分段）无 lowering，需要手写纯 TS 替代或降级为简单实现——影响编辑器光标词级移动体验，是 TUI 路径上最大的单项工作量
- pi 上游持续演进（tsgo、supply-chain 约束），本分支按"冻结一个版本做静态化"的思路进行
