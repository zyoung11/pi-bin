# static-pi：用 scriptc 静态编译 pi（无 JS 引擎）

> ⚠️ 测试提醒（2026-08-29 用户指定）：后续冒烟/真跑一律用 `llamacpp/MiniCPM5-1B` 模型（`--model "llamacpp/MiniCPM5-1B"`）。

## 第四十九轮记录（TUI 用户报告 10 项问题修复：SIGSEGV/全白/steering/选择器槽位）

- **用户真机 TUI 报告 10 项**，全部定位到根因并修复，新二进制 `pi/pi-native`（8.6MB）重建。
- **`-c`/`-r` SIGSEGV + 启动 unhandled rejection（重大编译器缺陷实锤）**：scriptc 运行时无法把 `JSON.parse` 裸动态记录 re-tag 进 FileEntry/SessionEntry/AgentMessage 联合——cast 后任何 typed 字段读即崩（“expected object×N got object”，同一缺陷在不同上下文分别表现为 SIGSEGV/TypeError）。**修复 = pi 侧 revive 反序列化器**（session-manager `reviveFileEntry` ~380 行）：10 种条目臂 + 嵌套 AgentMessage 7 臂 + content 块（text/image/thinking/toolCall）+ usage/cost 全部经 unknown dyn 通道读 + 显式重建；`parseSessionEntryLine` 换用 revive。新规则：**JSON 边界进联合类型的值必须逐字段重建，永不 cast 后直读**（与此前 header 检查的 recordViewOf 模式同源，本次推广到全量）。
- **探针方法论再验证**：SIGSEGV 用 gdb bt 定位到 `sc_f__x25_m120_buildSessionContext`；逐语句打印二分（s1–s9）复现为干净 TypeError；`revive` 形态在探针中全链路验证后再落源码。注意：探针必须复刻真实数据形状（外层 timestamp 是 ISO 字符串、内层 message.timestamp 是 number——测试数据写错会浪费时间）。
- **全白 TUI 根因 = copyStateFrom cast 视图字段写**：`this as unknown as {...}` 上的 `self.fgColors = ...` 全部静默 no-op（规则 ㉘ 实锤新案例），themeHolder 永远保持构造时空颜色；改直接字段写（去两个 readonly）。同文件发现第二缺陷：构造器颜色循环对 `Record<string, string|number>` 的动态 keyed 读运行时返回垃圾值（`#ff5fff` 等不存在值）——改 recordViewOf dyn 通道读。观察结论：**typed index-signature record 的动态 keyed 读在编译期被 SC1090 拒（probe 实测），但部分上下文能编译通过——通过了的就是坏的，必须改 dyn 通道**。
- **steering/queued 错误**：字段改 `| null = null` 时漏改比较——`isCompacting` 的 `!== undefined` 与 `isRetrying` 同款恒真；改 `!== null`。教训：**类型层 null/undefined 语义迁移必须 grep 全部比较点**。
- **选择器槽位 invoke 失败**（/model /settings /thinking /scoped-models）：`dispose?: () => void` 槽 vs 回调推断 `dispose: () => void`——checker 宽松函数兼容放行、运行时无精确 lowering。修复 = `SelectorHandle` 类型 + 11 处调用点显式注解（规则 ㉕ 复用）。
- **`-r` 会话选择器崩溃**：`input.ts` 空文本时 `graphemes[0]` 对空数组 OOB trap（JS 语义 undefined）——3 处 length 守卫。**对 segmenter 结果的所有 `[0]` 读必须先 length 检查**。
- **/login 整体移除**（slash-commands + 补全 + 分发 + 登录集群 ~16KB）；**检查更新整体移除**（checkForNewPiVersion + checkForPackageUpdates + 通知方法 + npm view 子进程挂起源）。
- **验证**：tsgo src 清零；scriptc build 全图 0 诊断；`--version`/`--list-models`/`-c` 会话恢复/`-r` 选择器渲染（真彩色转义可见）/`--print --model llamacpp/MiniCPM5-1B` 对话全部通过。
- **遗留**：用户 settings.json 引用已删内置 provider 的 6 条 warning（用户配置）；TUI 交互项（/model 等、tmux 环境）待用户真机复验。

## ✅ 阶段 5/7 收尾完成（第四十八轮）：原生二进制全链路真跑通过

- **--print 输出丢失根因**：`blocks = output.content as StreamingBlock[]` cast 视图 push = 静默 no-op（数组赋值 = 值拷贝，与 probe47 结论同类）。修复：fresh 数组 + `output.content = blocks` 引用赋值 + done 前重新同步。
- **退出挂起根因**：静态构建 `process.off` 为 no-op → 信号监听器常驻 → 事件循环永不耗尽。修复：print 模式末尾显式 `process.exit(exitCode)`。
- **writeRawStdout 改 console.log 路径**（原 process.stdout.write 路径在 socket 化 stdout 上有阻塞风险）。
- **最终验证（全部 EXIT=0）**：`--version` 0.84.3 ✓；`--list-models` 模型表格 ✓；`--print --model llamacpp/MiniCPM5-1B` 模型回复正常输出 ✓。
- **产物**：`pi/pi-native`（8.8MB x86-64 ELF，动态链接 glibc，无 JS 引擎）。运行时需 `PI_PACKAGE_DIR` 指向主题等资产目录（静态二进制无内嵌资源）；已加 `PI_SKIP_VERSION_CHECK` 支持绕开 npm 更新检查（异步 npm view 子进程管道泄漏 + 事件循环等待 = 挂起）。
- **100% 编译目标达成：总账 712 → 0（未改一行 scriptc）**。

## 阶段 5 grind 第四十七轮记录（路线 A：不改 scriptc 拆雷 + 砍除，100% 编译）

- **总账 2 → 0（100%）**。用户决策：完全不改 scriptc，扩大 pi 侧修改面（拆雷 + 砍功能）。
- **根因重定性**：真正障碍不是 tail 簇 2 个 lift 错误，而是 ~40 处顺序敏感的 SC9001 ICE 桥点雷区（cast 擦除配对缺陷）。编译器源码实证：cast 的 inner 类型非 dyn/jsval 时纯擦除（return inner 保留源类型）→ 后续 bracket 读按目标 shape 配对、receiver 携带源 shape → 崩；inner 为 dyn 时 all-unknown-fields record 目标也擦除但类型是 dyn → 读走 dyn keyed read → 无配对 → 免疫。
- **拆雷（commit 16a78ec）**：~22 处静态源 cast 桥点改 `recordViewOf(value: unknown)` helper（读路径免疫、值正确）；写雷点按拷贝语义重写（settings-manager migrateSettings/persistScopedSettings、config-selector togglePackageResource/setProjectPackageOverride、model-runtime registerProvider 显式字段合并）；markdown.ts 改 TokensCode 收窄后直接字段写；keys.ts 加索引签名注解去 cast；删除零引用死代码 _replaceMessageInPlace。40 处大扰动后回到基线 2 errors、零 ICE——雷区拆除验证成功。
- **砍除（commit 2）**：models publication/refresh 链整体删除（运行时死代码：扩展已删 + 内置 provider 清零 → 无任何 provider 有 refreshModels → publishProviderModels 永不执行；fetchModels 全仓无赋值点）。Models.refresh 改 no-op。**探针 probe47 实证：任何 cast 视图的 keyed 写/删除在 scriptc 运行时均为静默 no-op（含存量 inline 写点）**，recordOf 返回物化拷贝（读 ✓ 写不落回原对象）——据此按拷贝语义重写。
- **砍除后扰动揭出 27 个潜伏 ICE（三类缺陷）+ 运行时长尾，全部 pi 侧拆解**：①union→record shaped cast 桥（session-manager/tree-selector/footer/agent-session/compaction/config-selector/model-resolver）；②instanceof 收窄桥（read/write/bash renderCall+renderResult 去 lastComponent 复用改全量重建，edit.ts r46 先例）；③management-http union spread 三元（FetchRetryInit 加索引签名 + init 归一化）；④tui.ts 多标签 switch 完全性（改 if 链）；⑤`as const` 数组在 union 上下文被 lower 成 tuple → 运行时 strand 拒绝（TUI_KEYBINDINGS 16 处加 as KeyId[]）；⑥satisfies 保留窄字面量类型 → 运行时 re-tag 拒绝（agent.ts DEFAULT_MODEL 改显式 Model<Api> 注解）；⑦MessageDetails JSON-safe 联合去毒（ToolResultMessage/CustomMessage 默认泛型从 unknown 改 MessageDetails，BranchSummaryEntry 改 CustomData——unknown 具名字段毒化 FileEntry 的 dynCheck）。
- **原生二进制首跑运行时语义修复（commit 3，均为"JS undefined 语义 vs 静态运行时 trap"长尾）**：①stripBom 改 charCodeAt（**startsWith 三元/record 返回路径触发字符串生命周期 bug，实证 corrupt JSON.parse 输入**——重大编译器缺陷发现）；②auth-storage/load 三处 Record 缺键读改 recordViewOf dyn 通道（typed slot 缺键 abort）；③openai-completions choices[0] 空数组守卫 + **finish_reason 改 string | null（llama.cpp 发 null 被 dynCheck 拒 → 全部 chunk 静默丢弃）**；④resolve-config-value 等 8 处 `[length-1]` 负索引守卫；⑤**event-stream.ts 重写 events+cursor 模型（for-of + await 只执行首迭代——scriptc 异步 lowering 缺陷，与 r13 for-await 同类；且 `undefined as unknown as T` 的 nullary narrow 在构造期即 throw）**；⑥overflow.ts errorMessage 守卫局部变量。
- **验证状态**：0 编译错误；8.8MB 原生 ELF；`--version`/`--list-models` 真跑通过（models.json 模型表格）；`--print --model llamacpp/Gemma-4-12B` 推进到模型流式响应（18 chunk 全部派发）。**遗留**：env 过滤链一个 arr OOB trap（gdb 定位 fn2330 = env-api-keys.ts:102 envVars.filter 回调，index 4/length 4）——同类的 undefined 语义长尾，下轮继续。用户 settings.json 引用已删内置 provider（deepseek/xiaomi/zai）的 warning 属用户配置未代改。
- **新规则库（r47 续）**：㉘cast 视图 keyed 写/删除 = 静默 no-op，读 OK（物化拷贝）；㉙Record 类型变量直接 keyed 写 = 可写拷贝；㉛for-of/for-await 循环体含 await = 只执行首迭代，改 while+索引；㉜startsWith 在三元/record 返回路径损坏字符串，用 charCodeAt；㉝union 上下文数组字面量被 lower 成 tuple → 运行时 strand 拒，加 as T[]；㉞satisfies 保留窄类型，赋 union 槽运行时 re-tag 拒，改显式注解；㉟unknown 具名字段使 record/union 不可 dynCheck，索引用索引签名或 JSON-safe 联合；㊞静态运行时：typed record 缺键读、数组负/越界索引、cast 视图写全部 trap 或静默 no-op——JS undefined 语义必须显式守卫。

## 目标

把 `pi`（coding agent CLI）用 `scriptc` 编译成**100% 静态、不嵌入 quickjs** 的原生二进制。

功能取舍（用户确认）：

- **TUI 交互模式为最高优先级**，print / RPC / JSON event 模式保留，除非实现起来非常麻烦
- **扩展系统完全移除**（不需要任何运行时插件加载能力）
- **模型来源只有 `~/.pi/agent/models.json`**（2026-08-27 用户简化：不再内置 deepseek/mimo 等任何 provider），条目全部走 `openai-completions` API；当前配置里是本地 llama.cpp OpenAI 兼容端点
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
3. **provider SDK**：openai/@anthropic-ai/sdk/@google/genai/@aws-sdk 全部砍掉（模型只从 models.json 来，全走 openai-completions）。`openai-completions.ts` 里对 `openai` SDK 的**运行时**使用只有两处：`new OpenAI({apiKey, baseURL, fetch, defaultHeaders})` + `client.chat.completions.create(params, requestOptions).withResponse()`，其余全是 `import type`（ChatCompletionChunk/MessageParam 等，保留为 types-only 依赖）。替换为自研 transport（fetch + SSE 行解码，~150 行）。**不用隔壁的 llmstream**：它的归一化事件模型丢掉 reasoning_content、cache token usage、tool_call 原始片段透传，错误语义（yield error 事件而非 throw）会断掉 pi 的 duck-typed 重试链；要用它保功能等于 fork 重写。只参考其 parser.ts 的分帧行为
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
4. **openai-completions fetch 化 + 内置 provider 清零**：砍掉 openai SDK → 自研 transport；`providers/all.ts` 内置注册表清零，只留 models.json 动态源
5. **按 build 诊断清单批量修复**：any → unknown、WeakMap/Set 形状、process.title 赋值删除、import.meta.url → __dirname、fs/promises.access 替换、TUI 的 Segmenter/v-flag/replaceAll、keybindings record 形状等
6. **`--npm-static` 收尾**：yaml/markd/chalk/diff/ignore/minimatch/semver/get-east-asian-width/highlight.js 等逐包验证，外围功能（mermaid/高亮）撞墙即砍
7. **全量构建 + 冒烟**：TUI 交互、bash 工具流式输出、三个模型真跑对话；`scriptc build` 零诊断

## 基线口径（2026-08-28 确认）

- 基线数字 = `scriptc coverage packages/coding-agent/src/cli.ts` 输出中 **reached 段** 的实例数（诊断行有 ×N 聚合前缀，需按实例累加；unreached 段永不导致 build 失败，不计入）。712 基线已用该口径精确复现（SC1090×199、SC2013×157、SC2020×100、SC2002×100、SC2004×60、SC2009×56、SC2011×15、SC2003×9、SC2012×6、SC1120×6、SC1100×2、SC1063×1、SC1043×1）。
- 逐点定位用 `scriptc build`（输出 file:line + hint）；coverage 只给聚合消息。
- ⚠️ 揭幕现象：修掉根因声明会让下游真实诊断显形，总量会先升后降（712→614→664→…），不要被总数吓退。

## 阶段 5 grind 第四十六轮记录（34→2，scriptc SC9001 ICE 阻塞收尾）

- **基线确认 34 → 收官 2**（tsgo src 全程清零；3 个 commit：b861742 tools 群 16 个、a18cdf3 settings/interactive/autocomplete 12 个 + Provider 去泛型化、8edfe34 ai 包 race/login 6 个→2）。所有改动均经探针矩阵实证，无黑箱猜测。总账 712→2（99.7%）。

### 破局方法论：probe46 极速探针（本轮最重要资产）

- `packages/coding-agent/src/probe46.ts` 独立入口，`scriptc build probe46.ts` 仅 **0.9s**（cli.ts 全图数分钟），本轮所有机制结论均由它矩阵实验实证，已固化为 route W 回归测试。
- **探针三铁律**（违者假通过/假阳性）：①被测函数必须 `export`（未导出且未被调用的函数体被 lowerer 跳过——静默不检查，会得出“此模式可行”的假结论，本轮 s1–s5/v4–v6 曾因此误导）②被测表达式必须真实可达 ③探针必须包含与目标相同的 `declare module` augmentation（否则 keyof 增强缺失报 SC0001 假阳性）。
- 仅被 `import type` 引用的类不会被 value-collect：Theme 只经 type-only 边进入探针图时，`copyStateFrom(other: Theme)` 自引用方法误报“方法不可编译”；补一个 value import（`import { theme }`）后消失。
- “图上下文浮动”现象（同代码小图过/全图崩）大多可还原为上述探针缺陷或 record 注册顺序差；少数为真编译器 bug（见 SC9001）。

### 新规则库（探针矩阵实证，编号续接 r44）

- ⑯ **ToolDef lift 死墙 = 函数值字段 contravariant 参数位的 unknown→specific**：execute 的 onUpdate、renderResult 的 result、renderCall 的 context 三处参数（内含 `details: unknown`/`state: unknown`）无法被具体类型定义 lift；covariant 位 specific→unknown ✓（`parameters` 字段/属性赋值均过）。SCDBG 佐证：width-shapes from/to 字段集完全一致时，错误在函数类型内部。
- ⑰ **Route W（宽边界+窄内部）定型**：四个工具定义统一 `ToolDefinition<typeof schema>`（TDetails/TState 取默认 unknown），边界函数参数一律宽类型，内部经模块级 unknown 参数 helper（bashStateOf/bashDetailsOf/editStateOf/editDetailsOf/readDetailsOf）还原具体类型——cast 写在 helper（unknown 参数）内可过，写在对象字面量成员内直接对 `context.state` cast 被拒。
- ⑱ **checked cast 目标禁含用户类字段**：`state as { c?: TextSub }`/`{ c?: BoxSub }` 拒（类实例非 JSON-representable，checked cast 只答 number/string/boolean/record/array/union）；core 类字段（Text）实测可行但勿依赖。edit 因此放弃 state 持组件，改纯 JSON state（preview/previewArgsKey/previewPending/settledError 上移）+ 每渲染重建组件（buildEditCallComponent 本就全量重建，行为等价；renderResult 变更后 context.invalidate() 触发下一轮 callRenderer 重绘）。
- ⑲ **成员内经 instanceof 收窄的 union 值**：方法调用/字段读 ✓（bash `last.rebuild(...)`、read `last.setText(...)`）；**传入闭包参数/直接 return ✗**（write `return apply(last)` SC2003）。工作替代：①改为类方法 `last.apply(...)` ②中间注解 const。另：复合守卫 `a === undefined || b === undefined` scriptc 不收窄（TS 收窄），需拆独立 if。
- ⑳ **对象字面量成员函数直接 return 对象字面量**：scriptc 以“裸推断”（上下文无关：content 元素 `{type:string; text:string}`、details `null|undefined`、缺 optional 字段）作为 expected，与上下文推断的 got（全 AgentToolResult 形状）永奔，bash:482/defQ/defR 同源。修复 = 显式返回类型注解（`): Promise<AgentToolResult<unknown>> {`）或注解局部变量——defT/defS/defU 实证两者均过。
- ㉑ **runtime-optional capture 补全**：step.titleFn/item.submenu/method.login 第二次属性读值 → 提升局部变量（titleFn/descriptionFn/submenuFn）；`method.login!(...)` 非空断言单读亦可（`!` 走 unchecked 通道，无 capture）。⚠️ 但“局部持有可选方法 + 调用”在 models.ts 上下文触发 SC9001 ICE（见下），同型在独立 helper 内亦崩——提防。
- ㉒ **泛型函数声明期死墙确认并绕过**：raceWithAbortSignal<T> 体内 `new Promise<T>` 与 `.catch` 在任何形式下声明期即拒（<T> 未解析实例化检查，复核 r45 结论）；解法 = 按调用点具体类型展开 8 个 race 助手（raceVoid/Boolean/BooleanArray/Unknown/AuthCheck/Models/Credential/AuthResultWithAbort），体为 `Promise.race([operation, once-abort Promise<X>])`——race 同内层 ✓ 实证；信号已 abort 需先短路 `return Promise.reject`（once 监听不会对已 abort 信号触发）。
- ㉓ **Provider.stream 去泛型化（r44 指明正解落地）**：`stream<T extends TApi>(...)` → `stream(model: Model<TApi>, options?: StreamOptions)`。消失三墙：generic 方法调用“receiver runtime class 不可证明”、ProviderStreams width-check 的 stream MISSING、泛型实例化揭幕链。provider-composer 回归 `base.stream(model, context, options)` 直呼。
- ㉔ **泛型方法实例化 = 隐性揭幕源**：经具体类接收者调用泛型方法（`baseModels.stream(...)`）会以实参实例化并 lowering 调用链体内全部函数（applyAuth 的 transformHeaders 函数值/`??` 类型改变/Omit 交叉 SC2008 墙群显形）；接口 signature-only 泛型方法调用则不实例化。嵌套泛型调用链的主体类型设计时即应避免 Omit/交叉/条件类型。
- ㉕ **上下文类型裸推断失配机制**（⑳ 的机制化）：scriptc 对 return/arg 字面量先做上下文无关推断再 coerce，与 TS 上下文类型拼写不一致时永远失配——注解是对齐手段。
- ㉖ **keybindings.ts 残留 tui/src/index.ts barrel 导入** = Keybindings 类型双身份毒源（declare module 增强路径同步迁移到 keybindings.ts 直连）。
- ㉗ autocomplete fd 子进程重写定型：`const child: ChildProcess = spawn(...)` 显式注解避开 ChildProcessByStdio；exit+stdout end 握手替 close（close 不存在）；kill 去 exitCode 守卫；TextDecoder.decode 在 tui 图浮动 → 手写增量 UTF-8 解码（pendingBytes 尾部不完整序列缓冲 + fromCharCode 代理对）。

### SC9001 ICE（scriptc 编译器 bug，本轮唯一未解）

- **现象**：models.ts publishProviderModels 的 tail/emptyChain/publicationChains 类型簇做任何非平凡改动（typed `catch(() => undefined)`、then/catch 返回 `undefined as unknown`、helper 返回 unknown、`Map<string, Promise<boolean|undefined>>`、executor emptyChain、wrapper 对象、数组重构——共 8 种变体实测），全图 38 个 SC9001 在无关文件爆发：`internal compiler error: in normalizeOptionalNulls: recordGet receiver: expected record:r1656, got record:r788`（package-manager/session-manager/validation/compaction/config-selector/tui 等处的 `as unknown as Record<string, unknown>[key]` 桥点）。
- **根因**：`Record<string, unknown>` 索引签名 record 被 double 注册（r2 早期 / r194 后期），lowering 产出的 recordGet shapeId 与 receiver 映射 type 的 shapeId 不一致；validate.ts:3166 `expectType(e.obj, {kind:"record", shapeId:e.shapeId}, "recordGet receiver")` 全等比较崩。注册顺序对 models.ts 代码形状极端敏感（加删几行即翻转），呈“刀锋”行为；与启动缓存无关（清 ~/.cache/scriptc 与 out 目录均复现），与浮动无关（连续 4 次构建 38 稳定）。
- **已锁定触发矩阵（8 次构建对照）**：`catch(() => {})` 原样 ✓；任何 typed/变体 ✗；login 窄化（local/helper-arg/cast）✗；直呼 + 复合守卫 ✓。
- **缓解**：该簇保持 committed 原样（map `Promise<unknown>` + emptyChain `Promise.resolve(undefined as unknown)` + `catch(() => {})`），遗留 2 个 lift 错误。
- **下轮正解（编译器级三选一，SC_DEBUG_FAIL 路线）**：①record 注册按结构去重（index-signature 归一化进 byKey）②validate 对 record-vs-record 做 shape 结构等价回退（fields/indexValue 递归 typeEquals）③前端放行 `Promise<X> → Promise<unknown>` 内层 lift（unknown=dyn 吸收语义，与 boundarySafe 对齐）。推荐 ①，根治整类“注册顺序浮动”。

### 编译器侧攻坚实录（本轮已试，未竟）

按下轮方案 ①②③ 实施了三个编译器补丁并逐一构建验证（scriptc/packages/compiler，dist 已同步重建）：

- **补丁 1（③ promise 内层 dyn 宽化）**：lowerer coerceToExpected 增 `Promise<X> → Promise<unknown>` 分支（复用 promiseVoidWiden 节点，C 层同一 ScrPromise* 指针、type-only 重解释，await 经 unknown 槽走 scr_await_dyn 读值，语义可靠）。**实测：410 set lift 解除 ✓**。
- **补丁 2（① validate 结构等价回退）**：expectType 对 record-vs-record 做 fields/indexValue 递归结构比较，相同则放行。**实测：ICE 不消失**——dump 证实两 shape 结构上**真不同**（want=r1656 `{$ref: dyn}` vs got=r788 全量 schema record），说明 recordGet 的 shapeId 来自 cast 目标、而 receiver 携带 cast 源类型——不是无害的双注册，而是 lowerAsExpression 擦除路径的真实 lowering 不一致。
- **根因定位（lowerAsExpression 静态分支）**：静态 record→record cast 走 `return inner` 擦除（保留源类型），后续成员读按 TARGET shape 生成 recordGet → receiver（源 shape）与 shapeId（目标 shape）不匹配 → ICE。补丁 3（该分支改走 coerceToExpected：同 shape 恒等、宽兼容走 copy-reshape、否则 SC2002 尖锐 fence）**实测：validation.ts 类 ICE 全消 ✓**——但全局 record 注册序扰动，触发另外两个潜伏 ICE（write.ts:273 call arg narrowing "expected object, got union"、management-http:61 unionIsTag "expected union, got record"）。
- **结论**：scriptc 存在**多重的 lowering 顺序依赖缺陷**（cast 擦除与后续读取的 shape 配对、instanceof 收窄桥的 armTag、union/record 注册序），修一个揭一个，是打地鼠不是收尾。根治需系统性工作：保证 body 单次 lowering（或 shape 注册全图统一）+ 收窄桥结构化。已将三个补丁回滚（编译器 dist 已还原重建），pi 树回退到 8edfe34 稳定 2 错误态。
- **下轮正确姿势**：不要逐点打地鼠；先建 scriptc 回归集（把 38 个 ICE 现场最小化成用例），再一次性修三处（cast 擦除配对、收窄桥结构化、注册去重），每个用例锁定一个缺陷类。

### 编译器侧攻坚实录（补丁已回滚，pi 树停在稳定 2 错误态）

本轮实施了三个编译器补丁并逐一构建验证（scriptc dist 同步重建）：

- **补丁 1（promise 内层 dyn 宽化）**：coerceToExpected 增 `Promise<X> → Promise<unknown>` 分支（复用 promiseVoidWiden 节点：C 层同一 ScrPromise* 指针 type-only 重解释，await 经 unknown 槽走 scr_await_dyn，语义可靠）。**实测：410 的 map set lift 解除 ✓**。
- **补丁 2（validate 结构等价回退）**：expectType 对 record-vs-record 做 fields/indexValue 递归比较。**实测：ICE 不消失**——dump 证实两 shape 结构上真不同（want=r1656 `{$ref: dyn}` vs got=r788 全量 schema record）：recordGet 的 shapeId 来自 cast 目标、receiver 携带 cast 源类型——lowerAsExpression 擦除路径的真实 lowering 不一致，非无害双注册。
- **补丁 3（cast 擦除改走 coerceToExpected）**：静态 record→record cast 不再擦除，同 shape 恒等/宽兼容 copy-reshape/否则尖锐 fence。**实测：validation.ts 类 ICE 全消**——但全局注册序扰动，引爆另外两个潜伏 ICE（write.ts:273 收窄 arg "expected object, got union"、management-http:61 unionIsTag "expected union, got record"）。
- **pi 侧同时穷尽了 tail 簇的全部变体**（typed catch/undefined-as-unknown/helper 返回 unknown/wrapper 对象/数组重构/registered 中转变量——8+ 种），每种或留在 lift 死墙、或触发 ICE 级联。结论：这两个错误在 pi 侧无解，必须修编译器。
- **为什么回滚**：补丁 3 修一类揭一类（write 收窄、management-http unionIsTag 是另外两个独立缺陷），逐点修是打地鼠；且每次扰动都会重洗注册序，无法验证收敛。三个补丁已全部回滚（dist 还原重建），pi 树 git checkout 回 8edfe34。
- **决定性实验（Route 1 void 形态 + 删链）**：publicationChains 改 `Map<string, Promise<void>>` + `queued.then(() => {})` 链 + 去 emptyChain（previous undefined 守卫）+ 甚至整簇删除（生成守卫已保证写盘串行，链是冗余保险）——**全部触发同一 38 桥 ICE 网，与簇形状无关**。决定性结论：桥点配对一致性依赖全局注册序，models.ts 该簇的任何增删改（哪怕删代码）都会重洗注册序引爆桥点。pi 侧重写路线正式关闭。
- **修正先前结论**："pi 侧无解"的准确表述是"该簇的任何重写都会触发 ICE 网"，而非"形状无解"——全 boolean 簇 + 复合守卫 + 直呼实测 ICE-free（1 个 SC0001），证明存在 ICE-free 形状，但**到达它的路径本身就会扰动注册序**（ catch(() => undefined) vs catch(() => {}) 一个词之差即翻转）。这是编译器缺陷，不是 pi 代码问题。
- **2026-09-XX 补充**：pushProviderModels/login 已随 8edfe34 稳定；410/412 的 lift 死墙 + 桥点 ICE 网只能从编译器侧根治。
- **路线 1（void 形态）也失败**：publicationChains 改 `Map<string, Promise<void>>` + `queued.then(() => {})` 链 + 去掉 emptyChain（previous undefined 守卫）+ 甚至整个删除链（生成守卫已保证写盘串行，链是 belt-and-suspenders）——**全部触发同一 38 桥 ICE 网**。决定性结论：ICE 与簇的具体形状无关，**models.ts 该簇的任何增删改（哪怕删代码）都会重洗注册序引爆桥点**。pi 侧重写路线正式关闭，100% 只能从编译器侧达成。
- **下轮系统性修法（一次到位，不打地鼠）**：①先把全部 ICE 现场最小化为 scriptc 回归用例（已定位三类：cast 擦除配对、instanceof 收窄桥 armTag、unionIsTag/recordGet 混配）②修 lowerAsExpression 擦除配对（补丁 3 已验证方向正确）③修收窄桥结构化（armTag typeEquals 失败后的结构回退）④每修一个跑全部用例，防新揭幕。预计 1-2 个专注会话。

### 遗留 2 个（models.ts:410/412，同根因）

```ts
const tail = queued.catch(() => {});              // Promise<boolean | undefined>
this.publicationChains.set(providerId, tail);      // Map<string, Promise<unknown>>：boolean|undefined → unknown 内层 lift 死墙
void tail.then(() => { ... === tail ... });        // 412 同源
```

修复形态已备（typed catch / wrapper 二选一），仅等编译器解锁。race 助手/登录流程/发布链路运行时语义均已保持（race 差异：输家 rejection 由 race 内部处理，无 unhandled rejection；已 abort 短路路径等价）。

### 下轮入口

1. scriptc 编译器级：SC9001 record 双重注册修复（上述三选一）→ 解锁 tail cluster → 0 错误。
2. 全量构建 + 冒烟：MiniCPM5-1B print 对话 + bash tool_call（r45 口径）+ `--list-models`。
3. 阶段 6 --npm-static 收尾 → 阶段 7 全量构建。

## 阶段 5 grind 第四十轮记录（进行中：204→96，长尾批量清零 + ResourceLoader 抽象类）

- **长尾批量（~90 个散点）**：armin/bash-execution/compaction/custom-message/energy 等 30+ 文件的 RegExpExecArray.index、filter 谓词、可选方法提升、Promise.resolve(void)、replaceAll、Math.max spread、Error cause、??= 写出等已验证模式全部套用
- **ResourceLoader 接口→抽象类**：修复 sdk/agent-session-services 的类→record 传参墙；DefaultResourceLoader 的 async reload → reloadAsync 委托（async override 墙）
- **sdk.ts**：excludedToolNameSet Set|undefined→数组 includes；toolResult 图片过滤链→显式循环；streamSimple options 补显式 signal 字段
- **provider-env**：Bun sandbox 回退降级为恒 undefined（Node 静态构建死代码），Map|null→Map
- **uuid**：randomFillSync 无 lowering → crypto.randomBytes().toString("hex") 手工解析
- **剩余 115 构成**：terminal 14（结构性）；provider-composer 8（OAuth 回调链）；model-runtime 7（prepareRequest Omit 泛型级联）；session 6（SessionTree view 字面量）；abort 5（raceWithAbortSignal 泛型）；agent-session 5；event-stream/transform-messages 各 4；散点约 45
- **验证**：tsgo src 清零；--list-models OK；MiniCPM5-1B print 真跑对话 + bash tool_call OK（OK-r41）
- **总账 157→96；本会话累计 376→96（-280，74%）**；剩余：provider-composer 8、model-runtime 7、session 6、abort 5、agent-session 5、event-stream/transform-messages 各 4，及散点约 50

## 阶段 5 grind 第四十四轮记录（进行中：116→71，工具裁剪 + grep 子进程重写）

- **用户决策：只保留 read/bash/edit/write 四个基本工具**。删除 tools/grep.ts、tools/find.ts、tools/ls.ts、tools/powershell.ts；tools/index.ts 裁剪（ToolName/allToolNames/ToolsOptions/switch/工厂函数全部收敛到 4 工具）；包 index.ts、sdk.ts 导出清理；cli/args.ts 帮助文本同步。createCodingToolDefinitions/createReadOnlyToolDefinitions/createAllToolDefinitions/createAllTools 保留但收敛；interactive-mode 的 fd/rg ensureTool 保留（fd 供 autocomplete，rg 供 bash 内使用）。净消 ~29 个诊断。
- **grep 子进程簇（已随砍除消失，但重写经验保留）**：spawn+readline → spawnProcess + 字节级行切分（LF 分割 + 逐行 decode，`
` 不会出现在多字节 UTF-8 内部）+ exit/stdout-end 握手替 close 事件；运行时验证通过（工具真跑返回结果）。ChildProcessByStdio/createInterface/readline.Interface.on 全部避开。
- **TextDecoder 怪癖（未解，下轮定位）**：`new TextDecoder("utf-8")` 构造后 decode 调用在 diag8 中全部通过、diag9 又复现（grep 250/311/400），疑似图序/声明解析浮动——需用 instrumented compiler 定位；output-accumulator 的字段形式 `private readonly decoder = new TextDecoder()` 确认不可映射（字段值透明句柄），改为方法内局部构造 + `incompleteUtf8TailLength`（已从 openai-http 导出）手写尾部缓冲替 `decode(stream:true)`。
- **renderCall/renderResult lastComponent 复用模式定型**（read/grep/find/ls 应用，grep/ls 已随砍除消失，read/find 保留）：`?? new Text(...)` → 早返回结构（undefined→新建+return；instanceof Text→就地 setText+return；兜底新建），**scriptc 对 `!==undefined && instanceof` 复合守卫不收窄**（赋值 `text = last` 报 got Component|undefined），必须拆开且赋值改早返回。
- **验证**：tsgo src 清零；MiniCPM5-1B print 真跑 + bash tool_call OK（OK-r44）。
- **剩余台账（diag10 全量，71 个）**：
  ① **ai 包 raceWithAbortSignal 调用点回归（~15，最大簇）**：ai/abort.ts 去泛型化后 `Promise<unknown>` 参数的内层 lift 规则比预期严格——`Promise<void>`（models.ts:452）、`Promise<boolean>`（:395，**调用点已 cast 仍报，cast 不抑制 arg 检查**）、`Promise<Set|undefined>`（:422/423）等全部被拒；coding-agent 同签名同实参却通过——**同代码不同包结果不同，需 SC_DEBUG_WIDTH=1 定位**。备选解法：仿 model-catalog-refresh/auth-storage 的「每调用点具体类型本地 race 助手」（机械但可靠，~8 处）。
  ② **bash.ts 输出累积器消费群（8）**：output-accumulator 类形状变化后揭幕——output.append/finish/snapshot/closeTempFile/getLastLine 方法链、new OutputAccumulator() 构造、renderResult ??/SC2003。
  ③ **edit.ts legacy 块（6）**：146-154 SC2002/SC2004 级联（rest/legacy 解构）。
  ④ **models-store（6）**：reload.promise 传参（需同 auth-storage 的具体类型 race 助手）、2 参 then、options?.signal?.throwIfAborted、SC2002 群。
  ⑤ **tools/index（4）**：ToolDef 值通道（return 通道也报了，需 SC_DEBUG_WIDTH）。
  ⑥ **settings 簇（5）**：settings-list:221、settings-submenu:217/218（**精确接口 SteppedSelections 作函数值参数仍 dynamic-only**，推翻本轮早前假设）、settings-selector:414（done(undefined,undefined) 的 SC2001，需 typed 常量中转）、interactive-mode:801（双跳仍拒）、tool-execution:301（unknown→含 unknown 字段记录双跳无效）。
  ⑦ 散点：runtime-credentials:38、write:202（已修）、output-accumulator:56（WriteStream 字段）、export-html:222（result 需双跳 cast）、auth-storage:445/460/567（LockResult 形状）、provider-composer:606/607（ProviderStreams cast 级联）、ai/models.ts 其余（?: 探测、new Map(entries)、values() spread、object spread union）。
- **本轮新增规则**：⑪ typed→unknown 转换（v as unknown）被 SC1101 拒 ⑫ as Promise<X> cast 不抑制实参 Promise 内层 lift 检查 ⑬ TextDecoder 构造/decode 存在跨构建浮动，需 SC_DEBUG 定位 ⑭ 类字段形式 TextDecoder 不可映射，方法内局部构造可 ⑮ 精确接口作函数值参数仍 dynamic-only（接口含函数值字段时整体无静态表示）。
- **验证**：tsgo src 清零；MiniCPM5-1B print 真跑 + bash tool_call OK（OK-r44）。
- **r44 续（同会话第二批）**：bash 累积器消费群根因拆除——output-accumulator 的 WriteStream 类字段（类毒化根因）→ appendFileSync/writeFileSync + tempFileCreated 标志，closeTempFile 变 no-op（bash.ts 8 个方法调用墙全消）；edit.ts prepareEditArguments 返回类型改 unknown、legacy 改 JSON 往返 cast + Record 循环重建（但 146:17 JSON 往返后 cast 到含 unknown 成员接口仍拒，待查）；export-html cast 目标对齐 renderer 参数形状；settings-selector onThemePreview 可选调用表达式体→块体。**71→63**；新揭幕：write renderResult/compound、file-mutation-queue（2）、edit:146 顽固。
- **r44 续三（SC_DEBUG 定位 + race 泛型摆动）**：SC_DEBUG_WIDTH 输出确认 ①{next,result} LockResult 块的 'unknown does not lift into null|undefined/StoredModels'（已修：导出 LockResult、6 处回调拼写 `Promise<LockResult<unknown>>` 完成签名 + models-store signal 守卫 + 2 参 then→then/catch 链）②ProviderStreams cast 的 'stream MISSING on source'——**Provider.stream 是泛型方法，在 record 宽度检查里不算已存在成员**（ Provider 接口去泛型化是正解，未做）③tools/index ToolDef 块的字段列表完全一致，墙在 execute/renderResult 函数类型内部（AgentToolResult 的 details: unknown 字段）。**关键定性：`Promise<unknown>` 作为类型本身不可映射**（credential-store 的 Map<string,Promise<unknown>>、race 参数均因此被拒），泛型版 `new Promise<T>` 声明期 T 未解析也被拒；但两版在基线/当前的表现随图上下文浮动（同文件基线 0 诊断、现 5 诊断，唯一 diff 是 then 链形式）。**下轮首选**：ai/abort.ts 用 `Promise.race([operation, abortPromise])` 数组字面量（abortPromise 用 `new Promise<void>` 只 reject——race 要求同内层，需验证 T 版可否）或逐调用点具体类型助手；及 Provider 接口 stream 去泛型化评估。**63→54**（ai/models.ts 簇随泛型回归全消，剩 ai/abort.ts 声明期 5 个）。
- **r44 续四（ai 簇机械扫尾）**：models.ts——getProviders Array.from(values())→for-of、resultErrors new Map(entries)→for-of set、credential/stored 的 `?.type` 判别→守卫+直读（×4）、method?.login→守卫+局部 login 直呼、Promise.race 2 参 then→then/catch 链；resolve.ts——current/post 的 `?.type` 守卫化、overrides.env 合并 spread→循环重建（消 union spread）；credential-store:23 `?? Promise.resolve()`（Promise<void>→Promise<unknown> lift 拒）→ `undefined as unknown` 中转。**54→49**。剩余 ai 侧：abort.ts 声明期 4（泛型 new Promise<T>/catch）、models.ts ~9（422/423 Set|undefined+refreshModels 函数值数组、428 Promise.all voids、471/529/602/628 待复验）、resolve.ts ~3（58 await 混合 union、107 三元 Promise|undefined）。
- **r44 续五（bash/write/edit 渲染群改早返回，揭幕回潮至 62）**：write/bash renderCall+renderResult 全部改早返回结构（undefined→新建 / instanceof 收窄 / 兜底，**无 undefined 守卫的裸 instanceof 也被拒**）；output-accumulator appendFileSync(Uint8Array) 拒 → writeFileSync+flag 亦拒（SC2020 flag 选项）——待解：改写解码字符串或 openSync/writeSync；file-mutation-queue realpathSync 替 fs/promises.realpath、then 2 参→链、解构闭包→属性读（key/currentQueue/releaseNext 仍有 'binding form no lowering' 残余）；edit.ts renderCall/renderResult 揭幕（instanceof/in-on-error-record/catch 绑定群，~10）；settings-selector done typed 常量落地。净 -4 但 edit/write 群揭幕 +13。**下轮**：edit.ts 群（in→bracket !==undefined、instanceof 加 undefined 守卫、catch 绑定窄化）、write:245/268（Container/WriteCallRenderComponent 同款）、output-accumulator 字节写方案、ai/abort 声明期 4。
- **r44 续六（edit/edit-diff 群 + 各渲染点位，62→63 浮动）**：edit.ts——getEditCallRenderComponent undefined 守卫前置（195/200 instanceof 清）、previewRecordOf 改 JSON 往返（union 双跳拒）、previewHasError 助手替 in 判别（setEditPreview 重写为 if/elseif 分支）、catch 绑定→instanceof 后 {code?: string} 双跳；edit-diff——NFKC normalize→手写 unicode replace、fs/promises.access→accessSync、catch 同款；write/bash renderCall+renderResult 早返回结构；bash ??=→if 写出。**新揭幕**：edit 201-203（getEditCallRenderComponent 守卫分支内 SC2003/2004）、396/398（withCode 双跳后残余）、427 renderCall 签名；bash 512/529/535（else-if 链收窄失效——scriptc 的 instanceof 收窄**只在早返回后的独立 if 中生效，else-if 链中不生效**，需全部改早返回 ×3 复制体）；output-accumulator:87/218（writeFileSync flag 选项拒——需改写字符串方案）；edit-diff:535（SC1063 残余——单跳 error as Record 需改 instanceof 后双跳）。
- **r45（ai 簇机械扫尾 + 连锁揭幕，63→58）**：models.ts——getProviders/resultErrors 循环化、credential/stored `?.type` 守卫化 ×4、method.login 守卫+局部直呼（login 函数值局部化后 'reading login on union' 清）、race then/catch 链；resolve.ts——current/post 守卫化、env 合并循环重建；credential-store:23 `undefined as unknown` 中转；render-utils getTextOutput 参数改 `(TextContent|ImageContent)[]` + for-of 收集；bash rebuild 参数改 `AgentToolResult<BashToolDetails|undefined>`（3 处 `result as any` 全消）；tool-execution getTextOutput 松散 content→精确 union 重建。**⚠️ 连锁揭幕**：mini-diff.ts 8 个（含 **2 个 SC0004 checker crash**——由 edit/AgentToolResult 类型变化引发，SC0004 需最优先定位）；ai/models.ts 393/395 的 race arg 在泛型回归后**仍报**（基线时同代码 0 诊断，图上下文浮动实锤）；resolve 152/170 的 `a === undefined || a.type` 复合守卫**不收窄**（需拆分）。
- **r45 续二（credential/login 群，49→37）**：credential-store modify 改 holder+then 链（消 return 通道 unknown→union cast）；models.ts login 按 type 分支拆分（method.login 调用后 `as Promise<Credential>` cast——OAuthCredential/ApiKeyCredential 臂精确匹配 Credential union 可过）；Promise.race([started, mutation]) void 内元被拒 → started.then + mutation.then/catch 双链（settled 语义等价）；resolve.ts/models.ts 的 `a === undefined || a.type` 复合守卫全部拆成早返回嵌套 if（**复合守卫不收窄实锤第二次**）。**运行时验证**：bash tool_call + --list-models OK（OK-r45）。
- **r45 续三（真基线 35）**：修 edit-diff 重复 constants 导入（SC0001 预检中止隐藏了全部分析——**SC0001 预检失败会让后续诊断全部不可见**，与 r5 的 SC1016 中止同机制）后全量分析跑通：**真基线 35**。本批已修：models.ts login/selected/race/refreshable、resolve 复合守卫拆分、credential-store holder、edit-diff readFile→readFileSync、export-html renderContent 构建、bash renderResult 早返回+AgentToolResult 参数、write renderCall apply 箭头、render-utils getTextOutput 精确 union。剩余 35 的构成待 diag30 全量清单（已保存 /tmp/diag30.log）。
- **r45 终（34 固化）**：ai/abort.ts 两种形式（链式 4 诊断 / 2 参 then 6 诊断）均失败——**泛型声明的 new Promise<T> 与 catch 在任何形式下都无法通过声明期检查，确认需 SC_DEBUG_FAIL 编译器级调查**；login `.then((c) => c as Credential)` 揭幕更多——保留 `as Promise<Credential>` cast（2 个，较优）；resolve.ts withSignal 已是 Promise 返回（113 三元混合 wall 需拆 if——if 修复已应用但 SC2003 仍在 113，三元两臂 Promise<AuthResult|undefined>|undefined 的 re-tag，下轮拆 if 后复查）。最终回归 **34** 固化。剩余分布：ai 11（abort 4/models 6/resolve 1）、settings 5、tools/index 4、edit 6、bash/write/edit-diff/export-html/tool-execution/interactive-mode/provider-composer/models-store/runtime-credentials 各 1-2。**全部台账与已知模式已持久化**；SC0001/SC0004 类中止或 crash 需优先检查（会隐藏全部诊断）。
- **r45 终二（settings 簇 titleFn 拆分实验，35→34）**：SteppedSubmenuStep 的 title/description 拆为 titleText?/titleFn?/descriptionText?/descriptionFn? 四字段（混合 string|fn 的 union 不可映射确认），selector steps 迁移；settings-list done 的 options 改 `{ navigateTo: string } | undefined`。**仍未解**：`(context: SteppedSelections) => string` 精确接口参数的函数值在接口成员位置仍 SC2011（对比 ToolDefinition.renderCall 的 fn 成员可映射——差异待 SC_DEBUG 定位，疑似 SteppedSelections 或嵌套 done 的形状问题）。剩余 34 个全部需要逐簇 SC_DEBUG_WIDTH/SC_DEBUG_FAIL 插桩定位（台账与复现命令齐备）。
- **总账 116→71→63→54；剩余台账**：bash.ts 输出累积器消费群（8，output-accumulator 类形状变化后揭幕）、edit.ts legacy 块（6）、tools/index 4（ToolDef 值通道，见 r43）、settings 簇残余（5）、runtime-credentials 1、write 1、散点（interactive-mode/tool-execution/settings-list 等）。

## 阶段 5 grind 第四十三轮记录（进行中：73→116 揭幕期，两大文件重复实现合并 + 工具 execute 体揭幕）

- **raceWithAbortSignal 去泛型化 ×2**：发现 coding-agent 与 ai 两包各有一份实现（同函数双实现），均已去泛型化（`Promise<unknown>` 返回 + 单参 then/catch 链）+ 全部调用点 `as Promise<T>` cast（14 处）。新规则：**Promise 内层 lift 限制**——`Promise<void>`、内层含 Map 字段（ModelsRefreshResult）、内层为 index-signature 记录（AuthStorageData）的 Promise 均不能流入 `Promise<unknown>` 参数，且 `as unknown as Promise<unknown>` 双跳被看穿无效；解法 = 具体类型的本地 race 助手（model-catalog-refresh 新增 raceRefreshWithAbort、auth-storage 新增 raceAuthDataWithAbort，~20 行×2）。
- **abort.ts 体内重写**：`new Promise<T>` 执行器 → `new Promise<unknown>`；2 参 then → `.then(handler).catch(handler)` 链（单参形式支持）。
- **fs-watch.ts 整体重写（fs.watch 无 lowering）**：轮询实现——文件走内容快照、目录走 `readdirSync().sort().join()` 列表快照，`setInterval` 1s 比对，`listener("change", null)`；返回 `FsPollWatcher{close()}`。footer-data-provider 的 headWatcher 改为轮询 HEAD 文件本身（原子写内容变化仍可检出）；theme.ts 改 `FsPollWatcher` 类型。
- **telemetry.ts**：`as const satisfies TelemetrySchemaDefinition` 两处删除（index-signature 接口→精确字面量的 checked cast 必拒）；`...operationStartAttributes`/`...operationErrorAttributes` spread（precise const 源不可合并）→ 显式键拷贝展开到三个 span；operationStart/ErrorAttributes 常量删除。
- **external-editor**：spawn `shell` 选项删除（win32 死代码）；`child.on("close")` → `"exit"`（stdio inherit 下等价）。
- **resolve-config-value**：appendLiteral 的 `previousPart?.type`（union|undefined 上的 `?.` 读）→ undefined 前置守卫 + 判别直读；spawnSync `input`（无 lowering，仅 legacy WSL bash stdin 传输使用）→ `bash -c <cmd>` argv 等价形式；`shell: false` 选项删除（默认即 false）。
- **其他清零**：context.ts（globalThis→process 直用、fs/promises.access→existsSync）、compaction estimateTextAndImageContentChars（unknown→Record 双跳 + bracket 读）、validation.ts:312（unknown===record 比较墙 → unknown 恒等中转变量）、frontmatter（`as unknown as T` 对泛型实例化无效 → `JSON.parse(stringifyUnknown(raw)) as T`，stringifyUnknown 为 unknown 参数助手——**union 实参直接 stringify 被拒但 unknown 形参可 lowering**）、tools/edit access 箭头、session-resources（unknown[] 类字段→string[]）、resource-loader（resolveProjectTrust 可选捕获提升）、session.ts view()（`return this` 类→接口 return 墙 → main lane 复用同一字面量转发，getLeafIdForLane("main") 语义等价）、queryBranchEntries（?? 类型改变墙 → if/else；`return []` → typed 空数组）、agent-session compaction_end 事件改走 _emitCompactionEnd 助手、transform-messages（map 回调 union re-tag → for-of + 单臂收窄克隆；flatMap 数组臂 → 循环；toolResult 臂显式字段克隆——spread 含 details: unknown 字段的消息被 re-tag 拒）、event-stream（IteratorResult 无映射 → 自定义 `EventStreamNextResult<T>{done; value: T}`，**value 不能是 `T | undefined`**（未解析 T 的 union 臂使接口不可映射）；agent-loop/lazy 消费点适配）、models.ts（createModels 返回类型改 ModelsImpl 并导出类，绕开 class→interface return 墙；model-runtime 字段同步改 ModelsImpl）、sdk.ts（`string|undefined` 上的 `+=` — **复合赋值目标用声明类型而非 CFA 收窄类型** → 收窄局部变量 + 纯 =）、tools-manager downloadFile（arrayBuffer() 亦无 lowering → 回退 reader.read() 循环 + `const bytes: Uint8Array = chunk.value` 显式注解，对齐 openai-http 模式）、render-utils（pathToFileURL().href → 手工 file:// + encodeURIComponent 分段）、package-manager-cli（Map entries Array.from → for-of entries + pair 索引读；updateTarget ?. 判别 → 守卫 + 直读）、settings-list/settings-selector/submenu（done 回调拼写完成签名 `(string|undefined, options|undefined) => void`；0 参箭头流入 1 参槽被禁；SteppedSubmenuStep 回调参数 Record<string,string> 函数值 dynamic-only → 精确 `SteppedSelections{model,level}` 接口 + machinery buildContext()）、read/grep/find/ls renderCall（lastComponent 复用：`instanceof` 左值 union|undefined 被拒 → undefined 守卫 + instanceof Text；返回 `text as Component`）。
- **tools/index.ts:184 残余**：specific ToolDefinition → ToolDef 的赋值/字面量字段通道被拒而 return 通道可行 → 改为逐工具调用 `createToolDefinition(toolName, cwd, options)`（return 通道），但仍报 8 个（待查，疑 ToolDef 内 execute 返回 AgentToolResult<unknown> 的 details: unknown 字段）。
- **验证**：tsgo src 清零；`--list-models` OK；MiniCPM5-1B print 真跑对话 + bash tool_call OK（OK-r43）。
- **总账 73→116**（表面数上升为揭幕：工具 execute 可选参签名拆除后，grep/ls/find/write 体内 ChildProcessByStdio/createInterface/readline、signal.addEventListener/removeEventListener 群、catch 绑定、?? 群全部显形）。**新揭幕大块**：grep.ts 子进程簇（~12，需迁 spawnProcess + data 事件，同 bash-executor 模式）、ls.ts（~8）、tools/index（8）、settings 簇残余（~6，ThemeSubmenu/SteppedSubmenu as Component 与 done(undefined) 的 SC2001 void|undefined）。
- **本轮新增规则库**：①`+=`/复合赋值目标用声明类型（union 声明即拒）②方法 `?.` 调用禁（属性 `?.` 读可）③catch 绑定禁 `: any` 注解④0 参箭头禁流入 1 参槽⑤可选参函数值作实参必须拼写完成签名⑥union 源的 as-unknown-as 双跳对 Record 目标无效⑦unknown→含 unknown 字段记录的 cast 拒⑧`value as unknown`（typed→unknown）亦被拒（SC1101）⑨fs.watch/Response.arrayBuffer()/spawnSync input/shell 为新确认的无 lowering 项⑩spawnSync/execSync 选项必须字面量且无 undefined 臂。

## 阶段 5 grind 第四十二轮记录（进行中：85→73，继续散点）

- **ResourceLoader 抽象类**：修复 sdk/agent-session-services 类→record 墙；DefaultResourceLoader async reload→reloadAsync 委托
- **已清**：compat 171（undefined 分支先行）、agent-session-runtime（rebindSession 提升、content 参数放宽）、agent-session 1652（entryTypeOf）、agent-session-services（spread→逐字段）、package-manager pinned（嵌套判别）、provider-attribution（URL→手写 host 解析、headers spread→循环）、resolve-config-value 28（?:链→直读）、usage-totals/tree-selector/messages/authorization-check/export-html/print-mode/session-export（jsonOf/recordOf unknown 参数 helper 化）、tools edit/read/ls（async 块体、箭头包装）、shell.once→on、paths statSync 去 bigint、mini-hosted-git-info URL→手写解析、bordered-loader union→双字段、models refreshControllers Map→数组对
- **验证**：tsgo src 清零；MiniCPM5-1B print 冒烟 OK
- **总账 约85→73；本会话累计 376→73（-303，80%）**
- **剩余 73 分类**：结构性/编译器需求（fs-watch 2、external-editor 2、raceWithAbortSignal 5、session SessionTree view 6、terminal 残余）+ 深联合/泛型（provider-composer OAuth 链 8、model-runtime prepareRequest Omit 级联 7、agent-session emit 4、event-stream 4、transform-messages 4、auth-storage LockResult 2、models/ModelsImpl 1、validation 1 等）+ 散点（settings-selector 2、tool-execution 1、resource-loader 1、runtime-credentials 1、sdk 1、agent-session-runtime 2、auth-check、agent-session-services 2、resolve-config-value 1、paths 1、export-html、telemetry 2、session-resources、auth/context 2、compaction 2、mini-git 2、interactive-mode 1、package-manager-cli 1、settings-list 1、frontmatter 1、tools/index 1）

## 阶段 5 grind 第四十一轮记录（进行中：96→85，散点清扫继续）

- **已清**：cli/args isValidThinkingLevel（readonly tuple includes→string[]）、agent-session-runtime rebindSession 提升+extractUserMessageText 参数放宽 unknown、agent-session 1652 entryTypeOf、agent-session-services spread→逐字段、package-manager pinned 嵌套判别、provider-attribution URL→手写 host 解析、provider-env typeof process 检查删除、validation delete→undefined 赋值、usage-totals/tree-selector/message 联合读 helper 化
- **本会话累计 376→约 85（-291，81%）**
- **剩余分类**：①深水区（provider-composer OAuth 链 8、model-runtime prepareRequest Omit 级联 7、session SessionTree view 6、agent-session emit/record 5、abort 泛型 race 5、event-stream 4、transform-messages 4、auth-storage LockResult 2、models Map<AbortController> 2、telemetry 2、compat/resource-loader/session-export/settings-list/tool-execution 各 1-2）②新揭幕散点（export-html cast、tools execute lift、resolve-config-value TemplatePart、compaction block cast、auth-check credential record、sdk 比较等约 20）

## 阶段 5 grind 第三十九轮记录（进行中：204→157，footer git 轮询改造 + 长尾批量）

- **footer-data-provider 8→0**：watchFile/unwatchFile/Stats 轮询 → setInterval + readFileSync 内容比对（两个 poller，首次读不触发）；spawnSync cwd → git -C；execFile 异步版 → 同步委托；cachedBranch 联合比较归一化为 string|undefined
- **native 加载链 no-op 化（-8）**：clipboard-native loadClipboardNative → 返 null（exec 回退仍在）；tui native-modifiers/native-module-path → getNativeModuleCandidates 返 []，helper 恒 undefined（静态构建无 native 加速，回退路径保留）
- **config-selector/keys/小文件批量**：config-selector 动态 keyed reads ×4 → resourceArrayFor helper；RESOURCE_TYPES.some → or 链；onToggle 双参；keybindings satisfies→显式注解、迁移表改 Record 查表；tools-manager 下载改 arrayBuffer+writeFileSync、spawnSync 加 utf8、os.arch→process.arch；version-check Error.cause 链降级
- **startup-ui/project-trust**：showStartupSelector 去泛型；Extension options tui→requestRender 回调（CountdownTimer 参数同步）；detector 字面量 record 包装绕类→record 墙；createStartupTui 返 TuiBase
- **agent harness session**：SessionStorage.appendEntry/appendRecord 去泛型化；frontmatter parseFrontmatter 去泛型 + JSON 往返（jsval 联合 cast 拒）
- **验证**：tsgo src 清零；--list-models OK；MiniCPM5-1B print 真跑对话 + bash tool_call OK（OK-r39/r39-bash-ok）
- **总账 204→157；本会话累计 376→157（-219，58%）**；剩余大块：terminal(16 结构性)、provider-composer(8)、sdk(7)、model-runtime(7)、agent-session(7)、session(6)、abort(5)、event-stream/transform-messages(各4)

## 阶段 5 grind 第三十八轮记录（进行中：241→204，config-selector/keys/tools 等小文件批量清零）

- **config-selector（组件+CLI）11→0**：RESOURCE_TYPES satisfies→as const；FlatEntry 判别→`"item" in entry` in 守卫（纯数据 union 可用）；动态 keyed reads ×4 → resourceArrayFor helper（if 链具体键）；RESOURCE_TYPES.some → 显式 or 链；onToggle 回调补双参；find on packages union → for-of
- **keybindings.ts 4→0**：satisfies KeybindingDefinitions 删除，KEYBINDINGS 改注解 KeybindingDefinitions（as const 的 readonly literal 不可赋回 Record）；KEYBINDING_NAME_MIGRATIONS 改 Record<string, string>，isLegacyKeybindingName 谓词→普通 boolean 查表
- **tools-manager 5→0**：createWriteStream+pipeline+Readable.fromWeb 下载 → arrayBuffer + writeFileSync(Uint8Array)（行为变更：无流式写盘，工具二进制 ≤ 几 MB 可接受）；spawnSync 加 encoding utf8 消 stdout/stderr Buffer toString；os.arch→process.arch
- **version-check 4→0**：Error.cause/AggregateError 链无 lowering → 只保留根 message（行为变更：错误详情少一层 cause）
- **startup-ui/project-trust**：showStartupSelector 去泛型（unknown 值 + 调用点 cast）；ExtensionSelector/Input options 的 tui 字段 → requestRender 回调（CountdownTimer 同步改参数）；detectTerminalThemeForAuto 的 ui → 字面量 detector record 包装（类→record 墙绕过）；createStartupTui 返回 TuiBase
- **session（agent harness）8→6**：SessionStorage.appendEntry/appendRecord 去泛型化 + commitEntry/commitRecord 去泛型；剩余 6 = SessionTree view 字面量×2（泛型类双实例化）+ 泛型级联，需编译器级调查
- **验证**：tsgo src 清零；--list-models OK；MiniCPM5-1B print 真跑对话 + bash tool_call OK（OK-r38/smoke-r38-ok）
- **总账 241→204；本会话累计 376→204（-172，46%）**

## 阶段 5 grind 第三十七轮记录（进行中：241，package-manager/package-manager-cli/migrations/config/word-navigation 全清）

- **config.ts 8→0**：getInferredNpmInstall 的 path 平台联合（path.win32 无 lowering）→ 直用 posix basename/dirname（Linux 静态目标下 win32 分支为死代码，行为备注）；3 处 filter 谓词 → 条件 push；Array.from(new Set([a,b])) → 手工去重
- **word-navigation.ts 7→0**：Intl/TextSegmenter 迭代器（Symbol.iterator/ArrayIterator.next）→ 数组下标遍历（segment() 本就返回 SegmentData[]）；PUNCTUATION_REGEX.exec().index 与 matchAll+new RegExp(RegExp) → charAt+isPunctuationChar 手写扫描
- **package-manager.ts 8→0**：runTasksWithConcurrency 彻底去泛型化（inputs: unknown[]、task: (unknown)→Promise<unknown>、返回 unknown[]，调用点 3 处改 typed task + 结果 cast）；taskRunner.fn 默认值改 async 箭头；typed-array toString → TextDecoder.decode
- **package-manager-cli.ts 7→0**：marker JSON.parse cast → Record<string,unknown> + bracket 读；catch 绑定 ELOCKED → error.name === "LockError"（mini-lockfile LockError 新增 name 字段，配合「unknown 上只允许 instanceof Error」规则）；Error cause 选项删除；process.stdout.columns → Record 双跳 bracket 读
- **migrations.ts 7→0**：oauth cred spread-after-explicit → JSON 往返 + Record 循环拷贝；delete settings.apiKeys → Record bracket delete；rmSync 直呼（去 ?.）；「press any key」提示删除（setRawMode/resume/pause 无 lowering，行为变更备注）
- **session.ts（agent harness）8→6**：SessionStorage.appendEntry/appendRecord 接口去泛型化（appendEntry(entry: ProvisionedEntry): Promise<Entry>），commitEntry/commitRecord/Session.appendEntry 去泛型，Session.appendRecord 泛型重载保留；conformance.ts 类型参数同步清理；?? 默认值类型注解；剩余 6 = SessionTree view 字面量 width-coerce ×2（泛型类双实例化）+ 泛型类级联，需编译器级调查
- **验证**：tsgo src 清零；MiniCPM5-1B print 真跑对话 + bash tool_call OK（OK-r37/smoke-r37-done）
- **总账 243→241（session 深水区未完）；本会话累计 376→241（-135，36%）**

## 阶段 5 grind 第三十六轮记录（进行中：287→275，editor/tree-selector 全清）

- **editor.ts 8→0**：paste 内 CSI-u 解码循环与 paste marker 重编号循环的 RegExpExecArray.index → segment 切片 + lastIndex 累加模式；`.replace(string, "")` → split/join；jumpToChar 的 lastIndexOf(fromIndex)/混合三元 → indexOf + charCodeAt 反向手写扫描；shouldTriggerFileCompletion 可选方法调用 → 提升局部变量
- **tree-selector.ts 8→0**：union 解构 → 逐字段读；msg.content/entry.content 联合读 → messageContentOf unknown 参数 helper（extractFullContent 本就收 unknown）；filter 谓词 → for-of；onSelect/onLabelEdit/onCopy 可选方法调用 → 提升局部变量
- **下轮台账**：provider-composer(8，OAuth/stream 泛型)、footer-data-provider(8，fs.watchFile/unwatchFile/execFile/git 轮询子系统集成性改造)、config(8)、session.ts(8，SessionStorage 泛型接口方法去泛型化)、word-navigation(7)、package-manager-cli(7)、migrations(7)、sdk(7)、model-runtime(7，prepareRequest Omit 级联)、auth-storage(5，withLockAsync 多调用点闭包返回形状统一，需编译器级调查)
- **验证**：tsgo src 清零；MiniCPM5-1B print 真跑 OK（OK-r36）

## 阶段 5 grind 第三十五轮记录（进行中：309→287，auth/model-runtime 簇深水区）

- **child-process 类型体系重构（-6，拆除顽固墙）**：`ChildProcessHandle` 从手写接口改为 `type ChildProcessHandle = ChildProcess`（node 原生类型）——spawnProcess 返回值不再 as unknown as 双跳；ChildProcessStream 接口删除；package-manager/session-share/child-process 的 `child.stdout as ...` cast 全部直呼（stdout.on("data") 原生可映射）
- **AuthStorageBackend 去泛型化**：`withLock<T>/withLockAsync<T>` → `LockResult<unknown>` 返回 unknown，调用点改用闭包外 holder 变量接收结果（泛型接口方法静态分派墙）；注意 **抽象类泛型方法也不支持**（abstract generic methods 直接拒）
- **async override 全清**：scriptc 对「非 async 抽象方法的 async override」逐个揭幕报错（read→list→...），全部改「非 async 覆写 + 私有 async 委托」模式：RuntimeCredentials/AuthStorage/ReadOnlyAuthStorage/InMemoryCredentialStore/InMemoryCodingAgentModelsStore/FileModelsStore/InMemoryModelsStore（ModelsStore 改抽象类）
- **options?.signal?.throwIfAborted() 两跳链全仓清零（18 处）**：新增 throwIfSignalAborted(options) helper（auth-storage/credential-store/models-store/runtime-credentials 各自本地）；单跳 `signal?.throwIfAborted()` 也会在部分上下文被拒，改 `if (signal !== undefined)` 守卫
- **Credential 联合字段读墙**：type/key/env 读全部被拒（双臂字面量不同 + index-signature 臂导致 cast/in 均不可用）→ credentialRecordOf(credential) JSON 往返 helper（unknown 参数 stringify 已验证模式）
- **runTasksWithConcurrency 收尾**：模块级 let taskFn（函数值 | undefined binding）→ taskRunner record holder（r12 模式）；早退 `return []` number[] 推断→taskRunner.results as TOut[]
- **model-runtime 剩 7**：prepareRequest 泛型 Omit 级联（598-606）+ enqueueCredentialOperation unknown 转换（688），需专项；**auth-storage 剩 5**：withLockAsync 多调用点闭包返回形状统一问题（409/423 expected result 形状互相矛盾，疑似 scriptc 单态化缺陷，需编译器级调查）+ createRequire 类
- **验证**：tsgo src 清零；--list-models OK；MiniCPM5-1B print 真跑对话 + bash tool_call OK（smoke-r35）
- **总账 309→287**；行为变更：auth.json 写入不再显式 mode 0o600（writeFileSync 3 参无 lowering）

## 阶段 5 grind 第三十四轮记录（进行中：376→309，interactive-mode 66→4，类根+record 墙批量拆除）

- **组件类根修复（每个解一片级联）**：model-selector/login-dialog 的 AbortController 类字段→createAbortHandle 适配器；scoped-models-selector `Key.ctrl("c")`→字符串字面量（全仓唯一调用点）；custom-message filter 谓词→for-of；compaction-summary toLocaleString→手写 formatTokenCount；bash-execution `a[i]+=v`→展开赋值
- **类→record 墙改类引用**：cache-stats `ModelPriceSource` 接口删除→参数直改 ModelRuntime 类（interactive-mode ×3）；FooterComponent 参数 ReadonlyFooterDataProvider→FooterDataProvider 类；session-share `editor: EditorComponent`→Editor 类（221/222 的 as unknown as Component cast 全删）
- **Component 基类新增 setExpanded 空实现**（对齐 handleInput/dispose 模式），删除 isExpandable 谓词（SC1101 根）与全部 duck-typing；注意：**scriptc 忽略手写谓词收窄**，isUsageBearingEntry 谓词无效→改 entryUsageOf unknown 辅助（entryUsageOf/messageRoleOf/messageJsonOf 系列 unknown 参 helper）
- **Editor 直接调用化（~12 个）**：Editor 是具体类，全部 `?.`/`!== undefined` 守卫/提升局部变量改直呼（setAutocompleteProvider/getExpandedText/addToHistory/setPaddingX/setAutocompleteMaxVisible/onSubmit）；22 处 `this.editor as unknown as Component` 双跳 cast 全删（Editor extends Component 直接引用）
- **信号面收缩（行为变更备注）**：interactive-mode 砍 SIGHUP/uncaughtException 注册与 process.off/removeListener（uncaughtCrash 方法删除）；SIGCONT 恢复改为 SIGTSTP 返回后同步恢复终端（kill 阻塞语义等价）；print-mode 信号循环改 if/else 字面量（对齐 rpc-mode，SIGHUP 不再清理）；上轮遗留的 opts?.signal?.addEventListener 提升局部变量+去 removeEventListener（once:true，泄漏至 abort 为可接受语义）
- **AuthSelectorProvider.method 联合拆字段**：method?: ApiKeyAuth | OAuthAuth → oauthMethod?/apiKeyMethod?/methodName? 三字段（含方法的接口联合无法 cast 成 Record，也无法 in 探测）；oauth-selector 104 与 interactive-mode 5476 的 method?.name 同步迁移
- **其余**：json-event toJsonEvent 重载合一 + toJsonAssistantMessageEvent 逐臂显式重建（union rest 解构禁）；print-mode role 读→messageRoleOf；truncationResult 参数收窄为 {truncated: boolean}（字面量缺字段墙）；VStack 子项 component 加 as Component cast；showSelector 返回 selector as Component（r28 模式）；编辑器 onSubmit async→void 包装（handleEditorSubmit 方法）
- **验证**：tsgo src 清零；`--list-models` OK；MiniCPM5-1B print 真跑对话 + bash tool_call 流式执行 OK（smoke-r34）
- **总账 376→309**；interactive-mode 66→4（剩余：CombinedAutocompleteProvider record×1、proc.stdout Readable|null 顽固墙×1 群、零星）；下轮：model-runtime(15)/package-manager(14)/editor(8)/tree-selector(8)/provider-composer(8)/config(8)/session(8)

## 阶段 5 grind 第十五轮状态（2026-08-31 深夜收尾：274，openai-completions 重写中途中止已回滚）

- 尝试重写 openai-completions.ts（buildParams 去默认参、for-await→next 循环、sseJsonLines async generator→next() 对象）时 python 批量替换破坏了文件结构，已 git 回滚至 274 干净态
- **下轮首批工作（openai-completions.ts 内部重写，约 18 个诊断）**：① buildParams 三个默认参数（Map/compat/cacheRetention）提升为必选，调用点已传入全部实参 ② sseJsonLines async generator（openai-http.ts:96）改 next() 对象（已验证草案，需小心手改）③ for-await chunk 循环改 while+next ④ delete×4→重建对象 ⑤ indexOf on union array→循环 ⑥ catch instanceof ⑦ computed spread bind const ⑧ index-sig spread 循环化
- 注意：python 批量替换大段代码时，断言失败后不会写盘，但跨多次 patch 的脚本一旦中途抛出，已完成部分丢失——**大改动一律单 patch 单验证**

## 阶段 5 grind 第二十七轮补充：record 墙根因定位工具落地

- **编译器插桩**：lowerer.ts 的 `describeRecordWidthBlocker` 新增 `SC_DEBUG_WIDTH=1` 门控探针——对每个失败的 record width-coerce 逐字段打印：目标字段 MISSING on source / 字段 lift 失败（from→to 类型）。compiler dist 已重建
- **关键发现**（SCDBG 输出）：①settings-selector 等的 record：目标字段 `truncatedBy/totalLines/maxBytes/...` MISSING on source——字面量未携带全部可选字段；②**selector 墙群**：`field 'component'/'focus': 'm85.Component' does not lift into 'mXXX.SelectorComponent'`——showSelector 的 create 回调返回 `{component: Component; focus: Component}` 注解与各调用处返回的具体组件类的 width-lift 不匹配——方向是**基类字段值→子类字段声明**（组件的 options/内部 record 的 focus 字段声明为具体类）③`'m85.Component' does not lift into 'm85.Container'`——record 字段槽的类→基类 lift 失败（疑 private 成员阻断，_baseFocused 已改 public 仍未解，需继续查 Container shape）
- **TuiForwarder→TUI 返回墙仍剩 1 个**：TuiForwarder 现为纯方法类仍 SC2002——待用 SCDBG width 输出定位具体失败字段（上面②③类的字段匹配问题同样适用）
- 下轮：按 SCDBG 输出逐 record 修（selector options/focus 字段改 Component；VStack 调用字面量显式注解；EditorOptions 字段级排查）

## 阶段 5 grind 第三十轮记录（进行中：411→397）

- **toString 清零**：hash.ts toString(36)→手写 toBase36；json-parse toString(16)→toHex4；tools-manager Math.random().toString(36)→去除随机段
- **parseInt 清零**：changelog ×3→parseVersionPart；keys.ts Kitty CSI-u ×3→parseDecimalInt
- **Array.from 变体清零**：uuid.ts Array.from(bytes, fn)→for-of+hexByte；usage-totals Array.from(map, fn)→for-of 收集+过滤；native-module-path Array.from(new Set)→去重循环；interactive-mode entries()→for-of 收集
- **editor splice 插入**：splitLine 的 splice→push+后移循环
- **keys.ts**：String.fromCodePoint×2→codePointToString（UTF-16 手写编码）
- **验证**：tsgo src 清零；MiniCPM5-1B print + bash tool_call 真跑 OK（r30-ok）
- **总账 411→397**；剩余：editor compound/splice/replace 群、interactive-mode union/record 深层、clipboard/package-manager 等零星

## 阶段 5 grind 第三十三轮记录（进行中：378→367）

- **clipboard execSync 字面量化（×5→1）**：options 变量→逐调用点内联字面量（input/timeout/stdio）；copyToX11Clipboard 改收 text 参数；wl-copy 的 spawn+stdin.write 管道写→execSync with input（ChildProcessByStdio<Writable> 管道写不可映射）
- **验证**：tsgo src 清零；MiniCPM5-1B print + bash tool_call 真跑 OK（r33-ok）
- **总账 378→367**；clipboard 剩 5（clipboard-native createRequire×3 结构性+spawn stdio pipe×2 已消）

## 阶段 5 grind 第三十三轮补充（进行中：378→376，CredentialStore 接口→abstract class）

- **CredentialStore 接口→abstract class**：实现者（RuntimeCredentials/ReadOnlyAuthStorage/AuthStorage/InMemoryCredentialStore）改 extends；构造器补 super()；import 拆分（value + type）；解锁 model-runtime 的类→接口参数墙（createModels({credentials...}) 的 classval→record 槽）
- **package-manager 泛型修复**：runTasksWithConcurrency 泛型函数的 TOut[] 数组字段→模块级 unknown[] 中转（TOut[].push 不可映射）
- **验证**：tsgo src 清零；MiniCPM5-1B print + bash tool_call 真跑 OK（r32-final）
- **总账 378→376**；model-runtime 10→15（泛型揭幕）
- 注：git checkout 误滚后重做了 CredentialStore 类化与 package-manager 泛型修复

## 阶段 5 grind 第三十二轮记录（进行中：397→378）

- **fs/promises.access 清零（×5）**：file-processor→existsSync；path-utils pathExists→existsSync（保留 async 签名兼容调用方）+ fileExists 删除；bash.ts fsAccess→existsSync throw；edit/read 的 access: 字段→existsSync Promise 包裹
- **验证**：tsgo src 清零；MiniCPM5-1B print + bash tool_call 真跑 OK（r32-ok）
- **总账 397→378**

## 阶段 5 grind 第二十九轮记录（进行中：414→411，terminal stdin 面部分修复，TUI 核心硬依赖确认）

- **terminal.ts 部分修复**：parseInt/Number(env)→parseDecimalInt/parseDecimalNumber（tui/utils 新增后者）；stdin data 监听参数 string→Uint8Array（setEncoding 删除后 stdin 直出字节流，TextDecoder 解码后进 StdinBuffer）；appendFileSync 3 参→2 参
- **TUI 核心硬依赖确认（结构性，需 scriptc 支持）**：process.stdin 的 setRawMode/isRaw/setEncoding/resume/pause/removeListener、process.stdout 的 resize 事件/removeListener/columns/rows、process.prependListener——这些是 TUI 运行时必需（raw mode 是终端交互的前提），无降级路径。约 12 个诊断 + 跨文件同类（clipboard/package-manager 的 execSync/spawnSync 等）
- **验证**：tsgo src 清零；MiniCPM5-1B print + bash tool_call 真跑 OK（r29-final）
- **总账 414→411**；剩余大头：interactive-mode(67)/editor(25)/terminal(11 硬依赖)/clipboard(11)/package-manager(10)/model-runtime(10) 等，模式全部有解但量大

## 阶段 5 grind 第二十八轮记录（进行中：442→414，interactive-mode 95→67，结构性根因全部拆除）

- **根因 3 彻底拆除：TuiForwarder 类删除→createInteractiveTuiReference 返回字面量 record**（29 个箭头函数字段逐一转发 self.getTui()，闭包捕获 self 实现动态转发）——类实例（classval）→接口 record 槽确认是 scriptc 死墙（SC2002 无 detail = requireExactShape 的 classval/record kind 不匹配），而**字面量 record→接口 width-coerce 可行**（函数值字段 lift ✓）——这是本会话最重要的架构发现：稳定引用用字面量 record 而非类实现
- **根因 2 彻底拆除：selector 墙群**——showSelector 的 create 回调注解 focus/component: Component 与各调用处子类实例的 lift 不匹配→全部调用处加 `as Component` cast（10 处）；机制确认：子类→基类字段 lift 在组件含不可映射成员时失败，cast 路径绕过
- **探针验证**：子类→基类 record 字段槽在简单类上可行（probe29），复杂组件失败源于不可映射成员
- **验证**：tsgo src 清零；MiniCPM5-1B print + bash tool_call 真跑 OK（r28-ok）
- **总账 442→414，interactive-mode 95→67**；剩余全部为机械叶子（splice/parseInt/process 事件面/record 形状零星）

## 阶段 5 grind 第二十七轮记录（进行中：400→442 揭幕，结构性根因 1 已拆、2/3 大幅推进）

- **根因 1 已拆：new Proxy→TuiForwarder 类**：implements TUI，34 成员逐一转发 getTui()（含 getter 转发字段 mode/children/terminal/wantsKeyRelease/onDebug→后改方法转发）；类型导入补齐（TuiStopOptions/TuiInputListener/RgbColor/TerminalColorScheme from terminal-colors.ts）
- **根因 2 大幅推进：类→接口 record 墙**：
  - Terminal：TuiBase.terminal/TuiAltScreen/TuiMainScreen 构造器参数/InteractiveTuiOptions.terminal/TuiForwarder getter 全改 ProcessTerminal 类（接口仅存类型层）
  - ReadonlyFooterDataProvider→FooterDataProvider 类（customFooter factory 参数）
  - ModelCatalogRuntime（Pick<ModelRuntime,"refresh">）删除→直接 ModelRuntime 类（model-catalog-refresh）
  - TUI 接口去字段化：mode/children/terminal/wantsKeyRelease/onDebug/fullRedraws 字段删除→getMode()/getTerminal()/setOnDebug() 方法（TuiForwarder getter 不参与 width-coerce 字段拷贝的根因）；TuiBase 实现三方法；全仓 ui.terminal→ui.getTerminal() 迁移
- **剩余单个顽固墙**：TuiForwarder 类→TUI 接口返回/传参仍 SC2002（width-coerce 失败，独立验证待编译器级调查——疑似 showOverlay 的 OverlayOptions 嵌套 record 或方法签名内的模块身份细节）
- **验证**：tsgo src 清零；MiniCPM5-1B print + bash tool_call 真跑 OK（r27-final）
- **总账 400→442（Terminal 迁移揭幕）**，interactive-mode 95（record 墙 ~40 + 其余）；下一轮：逐个 record 墙的 got 端分析 + TuiForwarder→TUI 墙编译器级调查

## 阶段 5 grind 第二十六轮记录（进行中：410→400，interactive-mode 108→87）

- **Terminal 接口 getter→方法全仓迁移**：columns/rows/kittyProtocolActive getter 改方法（接口 getter 不可映射），ProcessTerminal 实现与 6 个文件全部调用点迁移
- **FooterDataProvider**：branchChangeCallbacks Set<()=>void>→数组（Map/Set 值函数不可映射）
- **hasDefaultModelProvider**：in with computed keys→bracket + Record 双跳
- **tmux 键盘检测**：spawn 泛型返回→spawnProcess（ChildProcessHandle）+ exit 事件 + Uint8Array 监听
- **验证**：tsgo src 清零；MiniCPM5-1B print + bash tool_call 真跑 OK（r26-ok）
- **总账 410→400，interactive-mode 108→87**；剩余根因群（均有明确解法，下轮继续）：①new Proxy→TuiForwarder 手写委托类（TUI 接口 34 成员逐一转发）②footerDataProvider/组件 options record 墙（ReadonlyFooterDataProvider 等）→构造器参数改类引用③ChildProcessStream 接口 receiver（tmux stdout）→考虑接口改类④toLocaleString 已清；退出恢复终端块 process.prependListener/WriteStream 交叉⑥checkForAvailableUpdates number[]⑦零散

## 阶段 5 grind 第二十五轮记录（进行中：399→410，interactive-mode 145→103）

- **renderer 联合→TuiBase 基类**：字段/createInteractiveTui 返回/mountInteractiveTui 参数全部改 TuiBase（union 方法调用/instanceof 全消）；isViewportTUI 调用点改 instanceof TuiAltScreen；TuiBase abstract mode→具体字段 `mode: TuiMode = "regular"`（abstract 属性 this 读不可用），TuiAltScreen override "fullscreen"（去 protected）；Component 基类新增空 dispose()（子类可 override），disposeComponent cast helper 删除，调用点直呼 dispose()
- **setCustomEditorComponent 重写**：EditorFactory 返回类型 EditorComponent→Editor 类；duck-typing（unknown 中转/in/instanceof Map）全部删除→instanceof CustomEditor 收窄 + 直呼字段；this.editor 类型 EditorComponent→Editor，全部可选调用（setPaddingX?/addToHistory?/insertTextAtCursor?/getExpandedText?/setAutocompleteProvider?）改直呼
- **hasDefaultModelProvider**：in with computed keys→bracket !==undefined + Record 双跳（KnownProvider 字面量键表）
- **cancellable-loader**：AbortController 字段→createAbortHandle 适配器（tui/utils 导出）
- **验证**：tsgo src 清零；MiniCPM5-1B print + bash tool_call 真跑 OK
- **总账 399→410（renderer 解锁揭幕），interactive-mode 145→103**；剩余根因群：①toLocaleString×7→formatNumber②ChildProcessByStdio×5→spawnProcess③process.prependListener/WriteStream 交叉（退出恢复终端块）④组件 options record 墙（RefreshOptions/FooterDataProvider 等×8）⑤可选函数字段调用×6⑥record 形状×10；另：test/key-tester 补 dispose（Component 接口新增）

## 阶段 5 grind 第二十四轮记录（进行中：466→399，洋葱揭幕继续）

- **armin(28→0)**：全文件重写——effectState 的精确形状 cast（Record→{pos}）改 bracket 读写 + typeof；rain 状态展平为 dropsY/dropsSettled 两个 number[]（unknown 槽数组读出后 cast number[]）；Array.from({length}, fn)→循环；glitch 的 map 回调 union→for-if-push 循环；shuffledPositions 提取模块级
- **settings-selector(13→2)**：splice(start, 0, item) 3 参插入×11→insertAt helper（push+后移循环）
- **select-list(3→0)/editor.ts onChange(4→0)**：可选函数字段调用→提升局部变量（onSelect/onCancel/onSelectionChange/onChange）
- **bordered-loader(1→0)**：AbortController 类字段→适配器 record
- **session-export.ts**：createTrailingEntries 返回 readonly object[]→readonly Record<string, unknown>[]（object 类型不可映射）
- **session-share(25→4)**：new URL 2 参→字符串拼接；spawn→3 参字面量 stdio + Buffer→Uint8Array 监听 + exit 事件（close 不支持）；proc 判空后取 stdout/stderr；trailingEntries 政为注解 Record 变量中转
- **tool-execution(9→1)**：ToolExecutionComponent any 字段全清（rendererState/args/details→unknown/Record，ToolDefinition<any,any>→默认参数）；renderContainer union→Box 统一类型；renderResult 参数经 unknown 中转 cast
- **tree-selector(8→5)**：Map<SessionTreeNode, boolean>→Map<string, boolean>（entry.id 为键）；visibleChildren Map 键 null→"" 哨兵
- **验证**：tsgo src 清零；MiniCPM5-1B print + bash tool_call 真跑 OK
- **总账 466→399**；剩余顽固点：①session-share 177 ChildProcessStream 接口在全图中的 SC2003（独立构建 0，疑重载/图上下文）②tool-execution 301 checked cast③tree-selector 5 个④interactive-mode 自身约 100 个

## 阶段 5 grind 第二十三轮记录（进行中：360→466 揭幕深水区，tui index 导入全仓迁移完成）

- **重大发现：tui/index.ts re-export 产生双重类身份**。components/*.ts（tool-execution 等）仍从 tui/index.ts 导入，而 interactive-mode 已直连——同一 Component/Container/Box 类在编译图中存在两套模块身份（m80/m192/m97/m270…），跨身份赋值/构造全部被拒。这就是 interactive-mode 及其组件链大量 SC2002/m8x 诊断的统一根因
- **全仓迁移**：58 个文件的 tui/index.ts 导入自动展开为直连（导出→源文件映射表 + 逐名 type 标记保留）；2 个 as 别名导入手动迁移；11 个 import type 内重号 type 修正；KeyId 从 keys.ts 导入
- **custom-editor(1→0)**：actionHandlers Map<AppKeybinding, ()=>void>→Record<string, ()=>void>（Map 值函数不可映射→Record 动态键读写）；tui 导入直连
- **tool-execution**：rendererState/args/details 的 any→Record<string, unknown>/unknown；ToolDefinition<any,any>→ToolDefinition；rendererContainer union（Container|Box 三元）→if/else 赋值 + instanceof Box 收窄
- **剩余揭幕 466**：interactive-mode(145)、armin(28，彩蛋组件)、session-share(25)、settings-selector(13)、clipboard(11)、tree-selector(8)、tool-execution(9)等——全部为直连迁移后暴露的真实面；模式与已验证解法相同
- **验证**：tsgo src 清零；--list-models OK；MiniCPM5-1B print 真跑 + bash tool_call OK（r23-ok）

## 阶段 5 grind 第二十二轮记录（进行中：263→360 揭幕，TUI 包全清，interactive-mode 剩 136）

- **interactive-mode 导入直连收尾**：tui/index.ts 的全部导入（Component/Container/TuiAltScreen/TuiMainScreen/ScrollView/VStack/autocomplete/keys/keybindings/terminal-image/...）改为相对源文件直连，TuiLayouts namespace 删除（isViewportTUI/ScrollView/VStack 直连）；AutocompleteItem/SlashCommand 等 type-only 导入修正（node type-stripping 运行时校验）
- **tui 包全清（揭幕 25→0）**：
  - editor.ts：autocompleteAbort AbortController 类字段→适配器 record `{abort: () => controller.abort()}`（字段值 AbortController 不可映射）；Number.parseInt→parseDecimalInt（tui/utils 导出）；validPasteIds 的 new Set(values)→for-of add
  - stack.ts：addChild override 双参签名→单参 override + 私有 addChildWithStackOptions（泛型 override 签名墙）；entries.push 的 spread-after-explicit→显式赋值；clear 的 length=0→重赋值；isStackEntry 谓词的实现（union cast/unknown 中转/in 探测均不可用）→ 构造器参数收窄为 StackEntry[] 后直接访问，谓词删除
  - stack/v-stack/h-stack：abstract layoutType 经 this 读→子类 makeLayoutNode() 实现（abstract 属性 this 读不可用）；getLayoutNode 下沉
  - scroll-view/layout-node：getLayoutNode 返回 state: this→ScrollLayoutNode.state: ScrollView（type-only 循环 import 安全）；移除 LAYOUT_NODE/VIEWPORT_TUI Symbol 协议（computed method/field 不支持）——isViewportTUI 改 mode 判断；getLayoutNodeFrom helper 删除，layout.ts 改 instanceof Stack/ScrollView 收窄（instanceof 右侧须程序内声明的类 ✓）
  - layout.ts：primaryScrollView 经 node.state 直取（消接口→类 cast）；LayoutFrame 构造 spread-after-explicit→显式赋值；translateBox 嵌套字段复合赋值展开
  - box/tui/alt-screen-flash/settings-list：invalidate 可选方法调用→直接调用/undefined 守卫；length=0→重赋值
  - keybindings.ts：TUI_KEYBINDINGS 空数组推断毒化（(null|undefined)[]）→ [] as KeyId[] + 显式 KeybindingDefinitions 注解；rebuild 的 Map<KeyId, Set<Keybinding>>→Map<KeyId, Keybinding[]>（Map 值 Set 不可映射）；Object.entries over index-signature→keys 循环+bracket 读；in 检查→bracket !==undefined
  - stdin-buffer：去泛型 extends EventEmitter<...>→EventEmitter
  - tui.ts：OverlayFocusRestoreState 三臂统一 overlay 字段类型（unionDisc 要求同型字段）+ 构造点补 overlay: undefined；margin ?? {} 联合→if/else；isOverlayVisible 提升 options.visible；Set<Component>→数组 includes；deleteKittyImages Iterable<number>→Set<number>
  - tui-alt-screen：replaceAll→split/join；parseInt→parseDecimalInt×4；Set<ScrollView>→数组；onRightClickPaste/openUrl/copySelection 可选函数字段调用→提升局部变量
  - terminal-image：pathToFileURL().href→file:// 拼接（URL 类不可映射）；parseInt→parseDecimalInt；RegExpExecArray.index→indexOf 前置匹配×3；startsWith 2-arg→slice+startsWith
- **interactive-mode 其余修复**：isDeadTerminalError 去 NodeJS.ErrnoException cast（bracket 读）；RenderSessionItem 谓词实现改 renderItemType 辅助（保留 is 谓词签名）；BUILTIN_SLASH_COMMANDS/promptTemplates 的 spread-after-explicit→条件赋值；byId.values()+Array.from→for-of 收集；disposeComponent（Component→Record cast 失败，待换方案）
- **验证**：tsgo src 清零；--list-models OK；MiniCPM5-1B print 真跑 + bash tool_call OK（r22-check）
- **总账 263→360（揭幕）**，interactive-mode 剩 136；剩余根因模式：①TuiMainScreen|TuiAltScreen union 方法调用（renderer 字段）②Terminal 接口 getter 不可映射③new Proxy TUI 转发层需手写委托类④ChildProcessByStdio 类型⑤EditorFactory/autocomplete record 形状
- **补充**：commit df3af2c；新增经验：①node type-stripping 对值导入做运行时校验，type-only 符号必须标 type②空数组字面量在 Record 注解推断中塌缩为 (null|undefined)[]③unionDisc 要求同名字段在三臂类型完全一致（含 |undefined），统一臂字段可解开④abstract 属性的 this 读不可用，下沉为子类方法⑤Symbol 协议（computed method/field）统一改普通方法

## 阶段 5 grind 第二十一轮记录（2026-09-01：263→221→362 揭幕，interactive-mode 专项待下轮）

- **批量模板清零**：Math.imul×4→手写 imul（hash.ts）；codePointAt×7→手写代理对码点 helper（json-parse/tui utils/segmenter/shell）；Object.hasOwn×3→bracket !==undefined（keybindings）；MapIterator.next×3→for-of entries+break（auth-command/tui utils/terminal-image）；Object.freeze×2+isFrozen/values→deepFreeze 恒等降级（model-config/noop）；normalize("NFD")→恒等降级（path-utils，macOS NFD 文件名匹配功能损失备注）；globalThis.Buffer→删运行时分支（truncate，手算路径已验证等价）；WeakMap×3→线性数组引用等值查（file-mutation-queue/model-catalog-refresh）；AggregateError→自定义 SessionCleanupError 类
- **error-body(5→0)**：SdkErrorShape 交叉类型删除，extractStatus/extractBody/pickBodyText 全部改 unknown 参数 + asRecord 双跳 + bracket 读；isPlainNonEmptyObject 去原型检查（真实图中错误产生者已全是 JSON 纯对象）
- **pi-user-agent(4→0)**：node:os 动态加载删除，UA 简化为 process.platform/arch
- **version-check(3→0)**：response.json() cast 改 asRecord 模式；spread-after-explicit 改显式赋值
- **latex(3→0)**：LAYOUT_MARKER 循环体全部 Record 化（unknown 中转 + bracket 读 + typeof 判别），MatrixNode 的 Math.max spread→循环求宽
- **session-manager(12→0)**：新增模块级 entryIdOf/entryParentIdOf/entryTypeOf/stringifyEntry 辅助（unknown 参数 + Record 读）；JSON.stringify(entry as unknown)→stringifyEntry（探针验证 unknown 参数的 stringify 可降低）；.find on union→for-of+break；循环携带变量加显式注解（TS7022）
- **main.ts(10→6→揭开)**：chalk.red 绑定方法引用→if/else 直接调用；writableLength drain 等待删除（仅 benchmark 路径）；switch 多 case 合并→双跳 cast 读 path；resolved.path
- **interactive-mode 揭幕 139 个**：Map<string, Component & {dispose?}> 交叉类型→Map<string, Component> + disposeComponent helper（bracket 读 dispose + typeof 守卫 + cast 调用，探针验证）解开 main.ts 类构建链后，该文件（最大最复杂，含 Proxy TUI 转发层/new Proxy/checked cast Error 等）全部显形。**下轮专攻 interactive-mode 139 个**，净账 362
- **验证**：tsgo src 清零；MiniCPM5-1B print 真跑对话 OK；--list-models OK

## 阶段 5 grind 第二十轮记录（2026-09-01：280→263，ai 包四个文件全清）

- **provider-retry(9→0)**：确认上轮重写丢失了 headers 字段（429/5xx 重试链路隐性回归）后重写；新增 `ProviderHttpError extends Error` 类（status + 预提取的 shouldRetry/retryAfterMs/retryAfter 三个字符串字段，对齐 OpenAI SDK 检查面）；`headers?: Headers` 字段被证明不可行（Headers 类型在 scriptc 中为 unknown，毒化整个类）；catch binding 经 `caught instanceof ProviderHttpError` 收窄后使用；`Number.parseFloat`/`Date.parse` → 手写 `parseDecimalNumber` + RFC1123 `parseHttpDateGmt`（days-fromCivil 算法）；abortableSleep 去 removeEventListener（settled 标志 + once:true）
- **constrained-sampling(8→0)**：`JsonSchemaObject` 的 unknown 成员导致 checked cast 失败 → 按用户建议直接按已验证模式重写全文件：**所有联合/动态读一律经 unknown 参数辅助函数 + `as unknown as Record<string, unknown>` 双跳 + bracket 读写**（readConfigType/readConfigStrict/readConfigVariants/asSchemaRecord/stringArrayOf/arrayUnknown）；`new Set(values)`/`[...set]`/`Object.entries` 全部循环化；谓词收窄（isJsonSchemaObject 后读字段）被证实不可靠，一律不用
- **openai-http(7→0)**：HttpError 类改用 ProviderHttpError；TextDecoder stream:true → 手写 UTF-8 尾部不完整序列缓冲（incompleteUtf8TailLength）；globalThis.fetch 值引用 → customFetch if/else 分支；removeEventListener 移除
- **经验规则补充**：① export 函数体内的联合字段读（即使 typeof 收窄后）会被严格检查，非导出同码可过——但可靠解法是 unknown 辅助函数读；② 类型谓词收窄后的字段读在导出函数中不可靠；③ Headers 类型不可映射，fetch 响应头按需预提取为字符串字段
- **验证**：tsgo src 清零；--list-models OK；MiniCPM5-1B print 真跑对话 + bash tool_call 流式 OK
- **总账 280→263**；剩余分布：session-manager(12)/main(10)/model-runtime(9)/provider-composer(8)/package-manager(8)/config(8)/session(8)/package-manager-cli(7)/migrations(7)/sdk(7)/keybindings(7) 及长尾

## 阶段 5 grind 第十九轮记录（2026-09-01：290→280，openai-completions + openai-http 双双清零）

- **发现并修复第十五轮事故残留的结构损坏**：`retryProviderRequest`/`onResponse`/start push 原被困在 onChunk 箭头函数体内（自引用→运行时无限递归），收尾逻辑边界错位；本轮归位为 onChunk（guard+chunk 处理）→ start push → retry → onResponse → 收尾的正确结构。HEAD 上的 290 基线实际是在该损坏状态上测得的（编译可过但运行时已死）
- **openai npm 类型全量本地化**：删除 `openai/resources/chat/completions.js` import；chunk 类型（Chunk/Delta/Choice/Usage）定义在 openai-http.ts 并导出共用，消息参数类型（System/Developer/User/Tool/Assistant/MessageParam/ContentPart/MessageToolCall）本地化到 openai-completions.ts；ContentPart 文本臂加 cache_control 可选字段，彻底消除 WithReasoning/WithCacheControl 交叉别名
- **SC2009 变参误判根因定位（探针二分 + 编译器源码）**：`bodyReadsArgumentsLocal` 把函数体中**任何名为 `arguments` 的标识符**判为读取 arguments 对象——对象字面量键 `arguments:` 也命中（仅 `x.arguments` 属性访问豁免）；且读取 `.function` 成员同样触发（函数值被上下文引用时）。解法：① 字面量键改 `"["arguments"]:` 字符串键形式 ② `StreamingToolCallDelta` 改名 fn/args + normalizeToolCallDelta（unknown 入参 + Record 双跳读）在 onChunk 入口归一化 ③ StreamingToolCallBlock 本地化不 extends ToolCall
- **buildParams 完成括号写改造**：全部 `(params as any).x = v` 与 cast 别名（zaiParams/basetenParams/openRouterParams/togetherParams/stringThinkingParams）改为 `params["x"] = v` bracket 写；`Object.assign(params, {[field]: budget})` 改 `params[field] = budget`；resolveClampedThinkingBudget 参数改 Record<string, unknown> + typeof 读
- **其余模式**：filter 类型谓词/回调值收窄→for-of + 判别式 push（assistantTextParts/thinkingBlocks/toolCalls/legacyReasoningDetails/textParts）；transformMessages 回调补全 3 参签名；`.find` on union、`??=`/`||=` 全部写出；switch on unknown → if/else bracket 读；OpenAIReasoningDetail 三臂扁平化（消 Record 交叉）+ structuredClone 替代 union spread；getToolsByName 重写（去 Iterable/Array.from）；catch 绑定 cast → readRawMetadata(unknown) 辅助 + HttpError extends Error 类（对齐 SessionError 模式）；TextDecoder stream:true → 手写 UTF-8 尾部不完整序列缓冲（incompleteUtf8TailLength）；globalThis.fetch 值引用 → customFetch if/else 分支；removeEventListener 无 lowering 直接移除（abort 监听器一次性语义不变）
- **验证**：tsgo --noEmit src 清零；`--list-models` OK；MiniCPM5-1B print 模式真跑对话往返 + bash tool_call 流式执行 OK
- **总账 290→280**，openai-completions.ts（28→0）与 openai-http.ts（揭开 7→0）清零；剩余分布：session-manager(12)/main(10)/model-runtime(9)/provider-retry(9 揭幕新增)/provider-composer(8)/package-manager(8)/config(8)/constrained-sampling(8)

## 阶段 5 grind 第十八轮记录（2026-08-31 深夜终五：274→290）

- **openai-completions 回调化完成**：streamOpenAIChatCompletions 改为接受 onChunk 回调参数并返回 void；Response/AsyncGenerator/迭代器协议完全消除；SSE 解析内嵌
- **openai SDK type import 全部移除**：ChatCompletionTool/CreateParams 等改为本地定义
- **新规则**：**Record 不可变——`params.xxx = value` 赋值在 scriptc 中报 assignment to non-variables，即使 params 类型为 Record<string, unknown>**。解法：把所有条件值先算为局部变量，最后一次性字面量构建
- buildParams 重构（~20 个条件分支，15+ 赋值→一次性字面量）为下轮首批工作，当前 28 个诊断集中于此
- **总账 479→290**，52 个 commit

## 阶段 5 grind 第十七轮记录（2026-08-31 深夜终二：294→298，openai SDK 类型移除揭幕）

- **openai SDK type import 全部移除**：`import type OpenAI from "openai"` 及 `openai/resources/chat/completions.js` 的 10 个类型全部移除
- **本地类型替代**：`ChatCompletionTool` 改双臂联合（function/custom），`ChatCompletionCreateParams` 改 `Record<string, unknown>`
- 揭幕至 +24 个新诊断（ChatCompletionTool 双臂类型展开、convertTools 返回类型、custom tool 字段等）
- **下轮继续**：openai-completions 剩余 openai 类型引用的本地化（ChatCompletionChunk/MessageParam/ToolCall 等需要本地定义）

## 阶段 5 grind 第十六轮记录（2026-08-31 深夜终：274，openai-completions 回调化 + 揭幕）

- **openai-http.ts 整体重写**：OpenAIStreamResult 改为 `{ response, processChunks }` 回调模式（不再返回迭代器/AsyncGenerator），sseJsonLines 移除，SSE 解析嵌入 processChunks 回调内
- **openai-completions.ts**：for-await→processChunks 回调（continue→return）；choice 判空 return；toHttpError 简化
- **揭开 openai-completions 18 个内部诊断**：buildParams 级联（已修默认参但还要检查调用点）、delete×4→重建、catch instanceof、spread→循环、indexOf union→循环、StreamingToolCallBlock 工厂、headers 值域、SC2013 openai SDK 类型残留
- **新规则**：Map 值不能是 any/unknown（→Record 动态键读写）；generic 合并形状数组不能 re-tag 到精确联合数组→逐元素转换

## 阶段 5 grind 第十五轮记录（2026-08-31 深夜终：274→294 揭幕至 openai-completions 内部迭代器）

- **buildParams 默认参提升**、**sseJsonLines async generator→next() 对象**（openai-http.ts）、**for-await→while+next**（openai-completions.ts）
- **关键发现**：scriptc 不支持 custom async iterable 的 for-await（SC1070 仅允许 process.stdin 和 Readable），也不支持手动 next() 协议（IteratorResult.done SC2020、openaiStream.next SC1090）——**迭代器协议整体在 scriptc 静态域外**
- **下轮解法**：将 SSE 解析从自定义 async iterator 改为 Node.js Readable 流（`new Readable({ objectMode: true })` + `push()`），或改用回调模式（`streamChunks(response, onChunk)`），这样 for-await 或 onChunk 回调都可以被 scriptc lowering。需要同步改 lazy.ts/forwardStream 和 agent-loop 的消费端
- openai-completions 19 个新诊断也包含：delete 重建 ×4、catch binding、computed spread、Map 默认参、indexOf on union——这些都是标准模板
- runtime 验证通过（拉取 cache 前正常）

## 阶段 5 grind 第十四轮记录（2026-08-31 深夜续五：282→274，揭幕至流式内核）

- ansi-to-html 5→0：exec 循环→matchAll for-of（唯一支持的带 index 形态）、toString(16)→hexByte、parseInt→Number
- tool-renderer 8→0：Map<string, any/unknown>→Record 动态键读写；renderResult content 逐块转换（generic 合并形状→逐元素精确字面量）
- export-html/index 8→4：parseInt→Number、replace 链→replaceAllTokens、opts 逐臂 if
- 揭幕至流式内核：openai-completions 18 个新诊断（buildParams 级联、StreamingToolCallBlock 工厂、headers 转、delete 重建、catch、spread）+ harness/session 8 个（泛型接口方法调用、?? 值域、union re-tag）
- **两个专项难点**：① openai-completions 流式内核（buildParams 多层级联、delete 重建、catch 绑定）② harness/session 泛型接口方法（appendEntry/appendRecord generic through receiver——接口签名即可泛型，调用点必经，需接口去泛型化重构）

## 阶段 5 grind 第十三轮记录（2026-08-31 续：296→293，核心异步链改造）

- **EventStream 重写**：scriptc 不支持 computed method names（`[Symbol.asyncIterator]`）与泛型类继承未实例化链——移除 AsyncIterable 实现，改公开 `next(): Promise<IteratorResult<T>>` + `result()`（notifyUpdate then 链唤醒，done 终态后返回）；agent-loop for-await 改 while+next 手动循环
- **lazy.ts 动态 import() 移除**：openai-completions.lazy.ts 改静态命名导入 + lazyApi(async () => ({stream, streamSimple}) as ProviderStreams)；namespace 对象作为一等值也被拒（SC1013）——必须用具名导入重组
- **事件字段读取模式确立**：runtime-optional capture 上的 cast+字段读全部失败，唯可靠模式是**逐臂 if-return 辅助函数**（eventPartial）；未知尾臂需显式 throw
- **unknown 参与的比较/运算**：`preparedArguments === toolCall.arguments`（unknown === record）被拒 → 若语义可接受则删除该快捷判断
- **void-promise 不能作 Promise.resolve 参数**：`Promise.resolve(emit(...))`（emit 返 void）被拒 → 改 async 函数推入数组

## 阶段 5 grind 第十二轮记录（2026-08-31：282→271）

- **markdown 8→0**、**rpc-mode 9→3**：process.on 仅支持字面量信号（SIGHUP/off 均被拒，off 改 detach 守卫标志）；stdin 读改 data 分块 + Uint8Array 参数；unknownCommand 固定 type（union cast 读字段不可行）；shutdown 参数必选化
- 新规则：**let 闭包重赋值（detachInput = () => ...）报 binding form no lowering** → record holder（`const inputDetach = { detach: () => {} }`）属性写入替换

## 阶段 5 grind 第十一轮记录（2026-08-31：292→282）

- **markdown 8→0 + mini-markdown**：trimPartialClosingFences 改 switch + 直读（undefined 前置守卫）；nextToken?.type → 前置守卫 + 直读；TokensGeneric.text → `(token as unknown as TokensText).text`（union→unknown→精确臂三段在 TS 层过，scriptc 接受）；RegExpExecArray.index → indexOf 前置匹配；MarkedExtension.tokenizer 从 unknown 改 Tokenizer 类型（消除 checked cast）
- **新规则**：TS 层允许的 union→unknown→精确三段 cast，scriptc 接受与否取决于目标臂是否含方法（Tokenizer 含方法被拒，TokensText 纯数据通过）

## 阶段 5 grind 第十轮记录（2026-08-30 深夜续四：325→292）

- **footer 10→0**、**git.ts 9→0**（new URL→字符串解析）、**bash-executor 8→0**（WriteStream→appendFileSync、Buffer.toString）、**settings-manager 11→0**、**package-manager 9→2**、**agent.ts 11→0**、**pi-user-agent 1→0**、**main 10→6**
- **child-process spawn/spawnSync 选项必须字面量**：spread、非字面量 detached、cwd 可选值、env 含 undefined 全被拒 → 字面量重建 + env 过滤。spawnProcessSync 保留 encoding: utf8（可选可选字段值也拒）
- **ChildProcessHandle/ChildProcessStream 重述对齐 scriptc lowered 形状**：listener 参数 Uint8Array、on/once string event；nodeSpawn 返回值 as unknown as ChildProcessHandle
- **剩余 child-process 6 个（下轮专项）**：child.stdout 的 Readable\|null → ChildProcessStream\|null cast 链全部被拒（含 as unknown 中转），疑似 scriptc child lowering 的 stdout 通道为特殊类型，需读写分离或 handle 直接持有 scriptc child
- 总账 292。剩余分布：session-manager(12 顽固)、main(10)、rpc-mode(9)、markdown(8)、tool-renderer/export-html/compaction/config/session(各8)、package-manager-cli/migrations/sdk/provider-composer/keybindings(各7)

## 阶段 5 grind 第九轮记录（2026-08-30 深夜续三：334→303）

- **agent.ts 11→0**、**settings-manager 11→0**、**footer 10→0**、**git.ts 9→0**、**package-manager 9→2**、pi-user-agent 1→0
- 新规则：**空数组字面量 `return []` 推断为 number[] 是一切联合 re-tag 失败的高频根因**（runTasksWithConcurrency 早退分支）——所有早退空数组必须 `const tmp: T[] = []; return tmp;` 或显式 cast
- **catch 绑定只能 instanceof 收窄后使用**：直接传参/赋值/cast 都报 SC1063；需要 code 字段时用 `caught as unknown as {code?: string}`
- CredentialStore 联合链（model-runtime 4 个）与 OAuth 回调链（provider-composer 7 个）需要专项：接口方法参数中的 AbortSignal 降级 unknown 导致 re-tag 失败

## 阶段 5 grind 第八轮记录（2026-08-30 深夜续二：365→334）

- **agent.ts 11→0**：defaultConvertToLlm filter→循环、push spread→循环、prepareNextTurn 可选链提升、failureMessage 改显式 AssistantMessage 注解（satisfies union 也失败，用显式类型注解）、空数组 cast、copyStringSet 辅助
- **pi-user-agent**：process.version/versions.bun 移除（User-Agent runtime 简化为 node）
- **model-runtime 11→4**：enqueueCredentialOperation 模块级去泛型（泛型 async fn 的 Promise<T> 即使模块级也在声明时被拒——**非泛型化 + unknown 返回 + 调用点 cast 才是出路**）、mergeHeaders unknown 参数化 + String 过滤、auth Map 对齐快照值域（含 undefined 槽位）
- **CredentialStore 联合链（model-runtime 剩 4 个 + auth-check 3 个）**：AuthOperationOptions.signal?: AbortSignal 在 interface 方法参数中降级为 unknown，导致实现/接口 re-tag 不匹配。解法候选：① CredentialStore 接口方法参数信号改 unknown（消费方有 unknown 上 throwIfAborted 会炸）② 接口重述合并 ③ 将 DefaultAuthStorage/ReadOnlyAuthStorage 统一为同一起点。需专项
- 剩余 334 分布：session-manager(12 顽固)、settings-manager(11)、main(10)、footer(10)、git(9)、rpc-mode(9)、package-manager(9)、markdown/tool-renderer/export-html(各8)、bash-executor/compaction(各8)、sdk(7) 等

## 阶段 5 grind 第七轮记录（2026-08-30 续：365→355）

- **latex.ts 13→0**：replaceAll→split/join ×4、Math.max spread→循环、Array.from→循环、循环携带变量 previousNode 改布尔标志、?. 判空化
- **theme.ts 12→0**：replace/toString(16)→numberToHex 手写、Proxy 导出→themeHolder.copyStateFrom(真实 Theme 实例 + 类内私有复制方法)、构造器参数交叉类型→纯 Record、withThemeColorFallbacks 值域统一、resolveThemeColors 去泛型、?? 子联合→colorOrDefault 辅助
- **config-selector 12→0**：Set<ResourceItem>→数组+refIncludes 泛型辅助、动态键读双跳、元组 cast
- **tui.ts**: Set<TuiInputListener>/Set<fn> → 数组 + indexOf/splice（解锁 TuiMainScreen 类构建）
- **总账 387→355**。当前分布：session-manager(12 顽固)、main(12)、settings-manager(11)、model-runtime(11)、agent(11)、footer(10)、git/rpc-mode/package-manager(各9)、markdown/tool-renderer/export-html(各8)。

## 阶段 5 grind 第七轮续（355）

- latex/theme/config-selector/tui.ts 全清（详见上节）。main.ts 10 个中 6 个修复，剩余：173/176（auth-check createAuthCheckModelRuntime 的 create 降级链）、371（switch 多 case 合并收窄后 union 字段读→双跳 cast 可修）、603（chalk.red 绑定方法引用→需局部化 colorFn 未完全解决，实际是 chalk.red 本身为绑定方法）、909-940（InteractiveMode 类构建链，根在 interactive-mode 526 Map<string, Component & {dispose?}> 交叉类型 → 改接口）。
- interactive-mode.ts:448 activeSelectorToken object→Record<string, never> 已修。

## 阶段 5 grind 第六轮记录（2026-08-30：390→387）

- **provider-composer 完全突破**：四个 Compat 接口加索引签名的方案证实不可行（`Omit<Required<T>>` 链路丢失具名字段，全变 unknown）已回滚；改用 **mergeCompat 参数/返回全 unknown + 调用点显式 cast**，provider-composer 21→8→剩余全挂在 OAuth 回调链（AbortSignal→unknown 降级入联合）。
- **session-manager 回潮 14→12**：Map 参数默认值（含常量引用）确认全部非法；flatMap 回调返 union 数组非法改循环；getMessageActivityTime 逐臂 timestamp。
- **剩余顽固点（12 个）全部是 SessionEntry/FileEntry 联合的深转型怪癖**：① 双跳 cast 后字段读报 SC1090（同模式在 agent 包探针通过——疑似 coding-agent 图上下文级联或 declare module 增强交互，需编译器级调查）② JSON.stringify(entry as unknown) 仍报（联合内含 unknown 嵌套成员，SC1101 转换拒绝）③ .find on 联合数组。这三个模式占据了 session-manager 剩余全部。
- 探针方法论更新：探针必须放在目标文件同包且包含相同 declare module 增强；跨包 type-only 探针会漏掉增强导致的类型差异。

## 阶段 5 grind 第五轮记录（2026-08-30：425→390，provider-composer 21→8）

- **provider-composer 全面重构**：mergeCompat Record 化（copyCompatRecord + unknown 参数）、mergeStringRecords/mergeUnknownRecords 工具化（spread 全部消灭）、configuredHeaders/rawModelHeaders/toOAuthCredential 循环化改写、login if/else 化、hasOAuth 判空。
- **关键发现：ProviderHeaders 与 Record<string,string> 互转是 re-tag 死墙**（值域 null\|string vs string 差异就报 SC2003）——整个 headers 链路必须统一值域类型。已统一为 Record<string,string>（withConfiguredAuth 内部重建 ProviderHeaders）。
- **structuredClone 保型方案验证失败**：clone(union) 后 cast 回 Record 报 SC2003——compat 联合内含不可重-tag 成员，Record→compat 联合 cast 与 union→unknown 转换均被拒。**下轮真正的解法是 ai 层类型改造**：给 OpenAICompletionsCompat/AnthropicMessagesCompat/OpenAIResponsesCompat/BedrockCompat 四个接口加 `[key: string]: unknown` 索引签名（types.ts 540/611/631/694 行），使 Record 互转合法；需同步验证 model-config 的 compat Schema Static 与消费方读取点。
- provider-composer 剩余 8 个全部挂在 compat 联合转换链上，加索引签名后应连带清零；其余待查：428（adaptOAuth callbacks 签名）、442/473（await getAuth 联合）、627/638（credential 可选链）。

## 阶段 5 grind 第四轮记录（2026-08-29 深夜续：425→403，agent-session 28→3）

- **AbortController 字段适配器模式**：lib 类 AbortController 不能直接赋给 record 字段 → 存 `{ signal: controller.signal, abort: () => controller.abort() }` 字面量（AbortControllerLike 接口）
- **event 字面量禁止先存 const 再 _emit**（字面量字会宽化，union re-tag 失败）；改为专用 helper 方法（参数精确类型 + 内联字面量，调用点上下文正确）。agent-session 新增 _emitCompactionEnd
- **event 臂字段 result: CompactionResult | undefined 改 result?: CompactionResult**（显式 undefined 在字面量中宽化为 null\|undefined 导致 re-tag 失败；optional 字段允许缺省）
- **runWithConcurrency 泛型方法委托模块级函数**（类内泛型方法不单态化）；调用点三处数据化
- **interface 可选参方法调用需显式传 undefined**：getModels(undefined)
- **enqueueCredentialOperation 重写**：Map<string, Promise<unknown>> 收窄 Promise<void>（Promise 不可变协变）；去 .catch/.then 链改 async 包裹
- **合并 union headers spread 改双循环重建**（index-signature spread 禁）；CredentialSynchronizationError ErrorOptions→cause 参数直传
- 新遇 3 个顽固点（下轮首批，需编译器级调查）：① `as unknown as { type: string }` 双跳后静态字段读仍报 SC1090（同模式探针通过，疑上下文级联）② helper 内联字面量丢 `\| undefined` 臂（result/errorMessage）③ afterToolCall 上下文签名 re-tag 不匹配

## 阶段 5 grind 第三轮记录（2026-08-29 深夜：479→425，两大文件全清 + 规则库扩充）

**全清文件**：session-manager(36→0，后揭幕的 14 也已再清)、model-runtime(30→~5)、runtime-credentials(3→0)、package-manager(15→0)。

**新确认规则（本轮实战）**：
- **Map 参数禁默认值也禁可选**（`byId?: Map` 与 `= EMPTY` 都报错）；常量引用默认在部分场景可用但不可靠——Map 类参数一律 required，调用点显式传
- **泛型方法在类内不单态化**（`private runWithConcurrency<TIn,TOut>` 实例化 TOut[] 报 SC2009）→ 委托模块级泛型函数
- **循环携带变量的双跳 cast 需显式注解**：`const p: string | null = (x as unknown as {...}).parentId`——否则循环推断成环报 SC0001（tsgo 同样报）
- **JSON.stringify(union) 部分现场 as unknown 后仍报**——注意排查是否是同函数内其他 blocker 的连带报告（先修已知根再复测）
- **interface 方法可选参降为必参**：`getModels(provider?: string)` 调用点需显式传 `undefined`
- **void | Promise<void> 全局清零完成**（14 处）；**可选属性二次读值提升局部变量**（17 处）
- **tsgo 与 scriptc 预检配置差异**：scriptc 用自身固定 compilerOptions，某些 keyof 合并/严格度不同——以 scriptc 预检为准逐个消

**剩余 425 的分布（下轮工作台账）**：agent-session(28)、provider-composer(21)、latex(13)、theme/config-selector/main(各12)、settings-manager/agent(11)、footer(10)、git/rpc-mode(9)、markdown/tool-renderer/export-html/bash-executor/config(各8)、session(8)、child-process/package-manager-cli/migrations/sdk/keybindings(各7) 及长尾。主要模式：agent-session 的 SessionEntry/AgentMessage 联合读值与 union re-tag 簇、各文件 codePointAt/replaceAll/Math.max spread/entries()/.values().next()/Promise.all 形态/类型谓词 filter/child.stdout?.on 提升等 stdlib 长尾。

## 里程碑：毒源清零（2026-08-29 夜：479，全部叶子）

SC_DEBUG 探针日志的 member-map-null + dynamic-only **唯一根降至 0**。剩余 479 个诊断全部为叶子（SC2020 stdlib 长尾×121、逐行 SC1090/SC2002/SC2003、SC2004 级联等），此后每修一个诊断就是净减一个，揭幕时代结束。本轮新增拆掉的毒源与确认的两条新规则：

- **void 臂同样禁止入 union**：`void | Promise<void>` 全部不可映射（与混合 Promise union 同罪）。全局清扫 14 处：回调返回值一律改 `=> void`（TS 中 Promise 返回可赋给 void 返回，await 语义不变）；需要返回值的（telemetry startSpan 回调、ToolContextSource）改纯 Promise。
- **可选属性二次读值（runtime-optional capture）**：`if (obj.optFn) obj.optFn(x)` 的第二次属性读值是运行时可选捕获→整个函数值 dynamic-only。修法 = 提升到局部变量（`const f = obj.optFn; if (f) f(x)`，即 t31 已验证模式的推广）。本轮清扫 17 处。
- **函数值数组不可作值**：`(() => Promise<T>)[]` 整体无表示（单个函数值可以，装进数组不行）。runWithConcurrency 重写为 `(inputs: TIn[], limit, task: (input: TIn) => Promise<TOut>)`——数据数组 + 单任务函数。
- **ReadonlyMap 无独立 lowering**（降级 Map<any,any>）；`new Map()` 不带泛型参数推断为 Map<any,any> 毒化整个字面量 record——Map 构造必须显式 `<K,V>`。
- 其余：convertMessages 取消导出（非导出 helper 豁免 npm 类型签名检查）；management-http 的 RequestInit 改本地窄接口 FetchRetryInit；provider-composer mergeCompat 静态化（index-signature 拷贝循环替代 union spread）；AgentLane prompt/steer/followUp/nextRun 四重载全合；assertJsonSerializable 重写（WeakSet/属性描述符/原型检查为静态死代码防御，环检测改 MAX_JSON_DEPTH=512 深度上限，错误码不变）。
- 调试方法论升级：SC2011 报在函数类型上 ≠ 该类型不可映射（instrumented 分解树单独测全 OK）——真根是宿主 record 失败或运行时可选捕获。用「agent 包内最小探针 entry」可隔离验证类型本身是否可映射（注意：非 cli 入口的探针会碰 keyof 合并预检 SC0001 假阳性，探针要放在目标包内）。

**剩余 479 的构成（下轮起纯 grind）**：SC2020×121（codePointAt/replaceAll/Math.max spread/Promise.all 形态/fs 长尾）、SC1090×~190（逐行形状）、SC2004×47 级联、SC2003/SC2002/SC2009 逐行残余、SC2012×15（replaceAll/Number.parseInt）。按文件：session-manager(36)/agent-session(30)/model-runtime(30)/latex(13)/theme(12)/config-selector(12)/main(12)。

## 阶段 5 grind 第二轮记录（2026-08-29 续：511，毒源榜持续清零）

- **重载去净续**：AgentLane.prompt/steer/followUp 三重载合为单签名（string | AgentMessage | AgentMessage[]）；SessionStorage/Session/存储实现的 findRecords 去泛型重载（无外部泛型调用方）
- **混合 Promise union 续**：EntryProjector、toProviderMessages 改纯 Promise
- **JSON 校验静态化**：assertJsonSerializable 重写——WeakSet/属性描述符/原型检查在静态构建不可映射且对编译器创建的普通对象属死代码防御，改递归 + MAX_JSON_DEPTH=512 环上限（cycle 语义改为 depth 报错，错误码不变）
- **provider-composer mergeCompat 静态化**：union spread 改 index-signature record 拷贝循环 + `as unknown as Record` 双跳；adaptOAuth 的 explicit-then-spread 改显式字段拷贝（注意 onPrompt 事件目标类型本无 allowEmpty，原 spread 传入也被类型层丢弃）
- **openai-completions**：convertMessages 取消导出（非导出 helper 豁免 npm 类型签名检查——模块 record 成员映射的直接解法）；grammarToolInputProperties ReadonlyMap→Map（ReadonlyMap 无独立 lowering）
- **Map<string,string> 陷阱**：`new Map()` 无泛型参数推断为 Map<any,any> 毒化整个 record（model-runtime refresh 回退字面量）；ReadonlyMap<string,Error> 降级为 Map<string,string>（Error 不可映射）
- **session-manager**：cloneEntryWithParent 单臂收窄克隆（9 个 discriminated type 各自 spread+显式字段）替代 union 属性赋值与 union spread（migrateV1ToV2 改索引赋值、buildSessionPath 路径重建）；byId 可选 Map 参数改带默认值必选（Map 不能作 union 臂）
- **filter 类型谓词清零**：布尔过滤 + 后置 `.map((f) => ({...f, header: f.header as SessionHeader}))` 收窄
- 真跑验证：MiniCPM5-1B print 模式往返正常

**下轮首要**：model-runtime `createModels` 返回 MutableModels|Models 类联合（SC2003 re-tag，预计要拆 createModels 或统一类型）；agent-session(30)/package-manager(20) 逐行 grind；`{type:"text";text:string}[]` dynamic-only（×4）待查；BodyInit/RequestInit 重述；latex.ts Math.max 混合 spread 与 codePointAt 长尾。

## 阶段 5 grind 第一轮记录（2026-08-29：482→504 揭幕期，根因毒源批次攻坚）

新快照起点 482（后续提交把基线从 416 揭幕到 482）。本轮不追单点，改攻 **member-map-null 毒源**（record 内单个成员不可映射即毒化整个 record，级联出下游 SC2011/SC2004）：

- **混合 Promise/非 Promise 返回 union 是重灾区**（union 臂规则：promise 臂仅当全为 promise）：`transformHeaders`、`GrepOperations`、`LsOperations`、`FindOperations`、`getArgumentCompletions`（Awaitable）全部改纯 Promise；调用点本就 await，默认实现改 Promise.resolve/async 即可
- **重载去净**：`getAuth`（ai Models + model-runtime）双签名合为单签名 `string | Model<Api>`（实现本就如此）；`ChildProcessStream.once` 合并为 `"data" | "end"` 单签名；faux `getModel` 三重载合为一
- **faux.ts**：`[Model, ...Model[]]` rest 元组 → `Model[]`；`FauxResponseFactory` 返回改纯 Promise
- **AgentTool.prepareArguments**：`Static<TParams>` 泛型条件返回类型不可映射 → 改 `unknown`（返回协变，实现方零改动）
- **ModelsRefreshResult.errors**：`Map<string, Error>` → `Map<string, string>`（Error 类不可映射；唯一读值点改 throw new Error(msg)）
- **edit.ts 交叉类型**：`Box & {...}` → `class EditCallRenderComponent extends Box`（类字段替代交叉）
- **layout.ts renderCache**：`Map<Component, Map<number, string[]>>` 双违规（Map 键必须 string/number、值不能是 Map）→ `RenderCacheEntry[]`（component 引用等值线性查 + 内层 number 键 Map）
- **mini-markdown 钩子**：`tokenizer: (this: Tokenizer, ...)` this 参数不可映射且 `.call` 被禁 → 去掉 this 参数直接调用；lexer 注入改在 Lexer 构造器里一次性赋值（StrictStrikethroughTokenizer.del 的 this.lexer 依赖保留）
- **agent-harness toolContext**：`object | (() => object | Promise<object>)` → `Record<string, unknown> | (() => Promise<Record<string, unknown>>)`（object 类型不可映射）
- 前一轮：AgentLoopConfig 三钩子 `signal?: AbortSignal` → `signal: AbortSignal | undefined`（可选 AbortSignal 参数 withUndefinedArm 返回 null 毒化整个函数类型）；emit turn_end 空数组字面量加显式类型；prepareNextTurn 可选链 await 改先收窄再 await

**教训**：SC2011 报在函数类型上 ≠ 函数类型本身不可映射（instrumented 分解树显示 OK）——真毒源往往是宿主 record 的其他成员不可映射，导致属性读值走 dyn 通道。必须用 member-map-null 日志找“on X”的宿主。当前毒源榜：`Map<any, any>`（30，来自 ReadonlyMap<string,Error> 已修）、SessionShareContext.editor（EditorComponent 接口待查）、SessionStorage.findRecords 泛型+重载等；504 仍处揭幕期，继续按毒源榜攻坚。

## 阶段 5/6 记录（2026-08-28：三墙突破 + 七个 mini 库 + 两个砍除）

**schema.ts 三墙突破（全部解决，712→614，schema.ts 自身 99→0）**：

- 墙 1+2+3 的统一解法：**精度走泛型参数、成员走运行时形状**。品牌接口成员全部退化为 record/数组/原始值（`properties: Record<string, PiSchema>`、`required?: string[]`、`anyOf: PiSchema[]`），`Static` 类型机制改走品牌泛型推断（`[S] extends [PiObject<infer P>]`）——record 成员与 record 源精确匹配，SC2002 cast 墙消失；required 条件类型成员删除，SC2009 消失。
- 空接口品牌（PiUnsafe/PiUnknown）在条件分支里必须排在**所有有成员品牌之后**（空接口匹配一切）。
- 标记整体消失：~kind/~unsafe 运行时零读者（grep 全图验证）→ 不存；~optional 改瞬时包装字段 `{"~optional": Sub}`，Object 构造时解包进干净 record——最终 schema JSON 与 typebox 逐字节一致，无需出口剥离、无需 defineProperty。
- width-coerce cast 是**逐字段拷贝**：品牌未声明的成员会被丢弃（description 曾消失）——品牌必须声明全部需存活字段；显式 undefined 成员（`description: options?.description`）JSON.stringify 自动跳过且键序与 typebox 一致；spread-after-explicit 在泛型实例化下被禁。
- 泛型动态键读被禁 → 注解中间变量 `const props: Record<string, PiSchema> = properties` 后按 record 读；`PiRecord<infer Value>` 单参推断错位（类型参数按位置绑定）→ 双 infer。
- 本地 Static 机制：品牌推断 + Defs 上下文穿透（Cyclic/Ref）+ StaticObjectOf 的 mapped-as 双向拆分（required/optional 两个 mapped 交集）；9 组 Eq 对照真 typebox Static 全 true；TS2589 未再出现。
- 验证器缓存从 defineHidden 非枚举属性改模块级数组（引用等值匹配）。
- 21 个消费文件 Static 导入切本地 schema；typebox-helpers 去 as any；src 全图 typebox import 清零。

**utils/child-process.ts 重写（scriptc 运行时实验 t27c 驱动）**：

- 运行时事实：spawn stdio 管道 data（Buffer→toString）/end/exit 触发；**close 事件不存在**（类型与运行时双重确认）；data 监听参数必须 Buffer 类型（或 Buffer-armed union）；`typeof x === "string"` 对 Buffer|string union 被禁。
- cross-spawn 移除（win32 分支目标平台死代码）；@types/node 签名类型换本地 ChildProcessHandle/ChildProcessStream/SpawnProcessOptions/SpawnSyncResult；removeListener/close 改 once+settled 守卫；waitForChildProcess 保留 exit+流空闲宽限语义（#5303）。
- bash.ts 改走 spawnProcess 并删除 WSL stdin transport 死代码分支（scriptc 禁止向子进程 stdin 写，静态围栏不管运行时可达性）。

**npm 墙归因实验（--npm-static 逐包 coverage）**：

- `ignore`（-21）、`string_decoder`+`partial-json`（-16）→ 走 --npm-static ✓（构建 flag：`--npm-static ignore,string_decoder,partial-json`）。
- `marked,highlight.js`（+20）、`yaml`（+315）→ 不可行：marked 的 lib/marked.esm.js 是压缩单文件（77 行超长行、单字符变量）被 preflight「非压缩 JS」判据拒绝；yaml 内部 schema 文件爆炸。
- ⚠️ --npm-static 集成会让 npm 包类型值流入 pi 代码并揭幕下游诊断（全量 6 包实验 532→902），不要盲目全开。

**七个 mini 库**：

- mini-chalk（coding-agent/src/utils）：10 样式 + NO_COLOR/FORCE_COLOR/TERM/isTTY 级别检测；12 文件切换。注意 scriptc cast 是逐字段拷贝：品牌未声明成员会被静默丢弃。
- mini-semver：valid/validRange/compare/gt/rcompare/satisfies/maxSatisfying（^/~/比较符/x-range/连字符/prerelease 排序）。
- mini-minimatch：*/**/?/[]/{}/nocase，段级递归匹配 + 模块级 regex 缓存。
- mini-lockfile：lockSync/lock + ELOCKED（LockError class 带 code 字段）+ stale 窃取（mtime 文件），类实例默认导出（record 存函数值丢可选参数语义）。
- mini-diff（ai/src/utils）：LCS（前后缀裁剪 + 9M cell 上限兜底）+ diffLines/diffWords/createTwoFilesPatch；与 jsdiff 8.0.4 输出**逐字节等价 8/8**（含 \ No newline at end of file、@@ -0,0 头、parts 键序 count 在前）。
- mini-yaml（ai/src/utils）：frontmatter 子集（块映射/块与 flow 列表/list-of-maps 归一化/字面块 | 与折叠 >/引号/注释），对照真 yaml 10/10 等价。
- mini-hosted-git-info：fromUrl 四字段（domain/user/project/committish），已知 host 列表 + scp/shorthand/web 形态。
- east-asian-width（tui）：宽字符区间表，签名收窄为 codePoint: number（调用点本就传码点）。

**砍除（按既定外围策略）**：

- highlight.js：syntax-highlight.ts 改 no-op（API 表面保留，supportsLanguage 恒 false → highlightCode 走既有主题纯色路径，消费方零改动）。
- grok-mermaid：components/mermaid.ts 删除、interactive-mode transformer 列表清空、settings-selector 移除条目；settings-manager 的 MermaidRenderingMode 类型保留做用户配置兼容。
- http-dispatcher.ts 去 undici：设置常量与 parse/format/applyHttpProxySettings 保留，configureHttpDispatcher 退化为校验 no-op（原生 fetch 接管；HTTP_PROXY 环境变量语义变化已备注）。

**tui Segmenter（Intl.Segmenter 无 lowering）**：

- tui/src/segmenter.ts：TextSegmenter + SegmentData{segment,index,isWordLike}，grapheme 走 UAX#29 实用子集（RI 对/Hangul Jamo/Mark+VS16/ZWJ/CRLF），word 按字母数字 run；真跑验证组合字符/emoji ZWJ 序列/国旗对/索引偏移全对。
- utils.ts 6 个 v-flag 正则清零：4 个直转 u-flag；`[\p{Spacing_Mark}--[᜴〮〯]]` 集合差改 isTerminalSpacingMarkRun 逐字符判定；`\p{RGI_Emoji}`（v-flag 专属属性）改 Extended_Pictographic 近似。
- editor/word-navigation 的 Intl 类型引用与 Iterable<SegmentData> 签名全切本地。

**marked 替代（mini-markdown，tui/src/mini-markdown.ts）**：

- marked v18 的 lib/marked.esm.js 压缩形态被 preflight 拒绝（不可修复）→ 自研 Lexer：块级（heading/fence 含流式未闭合/嵌套 list/task checkbox/表格/blockquote/hr/html/缩进代码）+ InlineLexer（strong/em/del/codespan/link/image/autolink/escape/html/br）+ Tokenizer 子类钩子（StrictStrikethrough del 覆盖）+ 块级扩展（latex）+ setOptions/use API。
- 对照真 marked v18：17/17 场景 token 结构逐字段等价；关键语义锚点：list_item.tokens 走 blockTokens + paragraph→text 映射（top=false 语义）、task checkbox token 前置、autolink 无 title、尾部 space 抑制、流式部分 fence 保留（#5825 的 trimPartialClosingFences 依赖）。
- markdown.ts 12 处依赖 marked any 宽松类型的访问改显式收窄；mini-markdown 自身 scriptc 诊断 0。

**当前基线（--npm-static ignore,string_decoder,partial-json）**：492 → 539（markdown 组件揭幕 +47，mini-markdown 自身 0）。剩余 539 的构成：SC1090×263（类方法级联 + record 形状）、SC2020×99（node API 长尾：Set/Map 迭代、Object.entries/keys 特殊形态、process.stdin 系列、path.win32 等）、SC2002×58（record 形状：TUI handleInput 系列 ×~20、keybindings、theme）、SC2009×30、SC2004×43（级联，随根因消）、SC2011×15、SC2012×11（变量 specifier import()：ai/auth/context.ts + env-api-keys.ts；.toString() on numbers）、SC2003×10、SC1100×3（JSON.parse cast 需运行时校验）、SC1101×1、SC1043/SC1063/SC1042 杂项。

## 阶段 5/6 第二轮记录（2026-08-28 续：539 → 401）

- **TUI Component 抽象基类重构落地**：`abstract class Component`（focused/wantsKeyRelease 具体字段、handleInput 空实现方法——基类字段与子类方法override 会 SC0001 冲突，必须用方法；同类型字段可重声明，不同类型被禁）、isFocusable 去 in、TUI 接口内联成员 + 方法拆分（stop/stopWithOptions、requestRender/requestRenderForce、renderNow/renderNowForce——record 通道丢可选参数，0 参调用者爆）。26+ 组件类 extends、字面量组件转真类（bash.ts/ bash-execution.ts/tui-alt-screen.ts）。
- **Api 类型解交叉**：`(string & {})` 不可编译（Model.api 根因）→ `Api = string` + `Model.compat` 条件类型解构为 union；faux 随机 api 串边界 cast。
- **SettingsManager 解锁**：Map<keyof, Set<string>> → Map<string, string[]>。
- **main.ts/package-manager-cli.ts exitCode 全清**（process.exit 无 lowering 替代 → 模块级变量 + 显式 process.exit，t29 验证 exit 码与 stdout 刷新）。
- markdown.ts 揭幕诊断清零（表格渲染复合赋值/in 守卫/mixed ||）。
- 注意：`erasableSyntaxOnly` 项目配置禁止构造器参数属性（TS1294）。

## 阶段 5/6 第三轮记录（2026-08-28 续二：401 → 365）

- **any 清扫第一波（类型声明层）**：`ToolCall.arguments: Record<string, any>` → unknown（毒化 AssistantMessage → 全图消息类型）；`AgentToolResult<T>` 加 `= unknown` 默认；17 个文件的 `Model<any>` → `Model<Api>`（Api=string 下结构等价）、`AgentTool<any>` → `AgentTool`（默认 TSchema 参数）——tsgo 零破坏。
- **mini-ignore 落地**（ai/src/utils）：gitignore 子集（否定/目录限定/根锚定/双星/字符类）；关键语义：**祖先链短路**（任一祖先目录被忽略即整路径忽略，深层否定无法翻盘——对照真 ignore 包 10/10 等价）；真包 `add(): this` 返回类型无法 lowering 是替代根因。3 个消费文件切换，npm-static 降为 string_decoder,partial-json，**SC2013 全码清零**。
- **markdown.ts 第二波揭幕清零**：TokensGeneric（索引签名）从 Token union 移出（毒化判别式收窄）→ TokenizerExtension.tokenizer 返回放宽 `Token | TokensGeneric`；TokensLatex 入 union；剩余 `||` → `??`；typeof 守卫删除。
- 当前基线 365：SC1090×157、SC2020×87、SC2011×23、SC2004×36、SC2009×17、SC2002×19、SC2003×8、SC2012×11、SC1100×3、杂项×6。

## 阶段 5/6 第三轮记录续（2026-08-28 夜：365 → 327）

- **mini partial-JSON**（ai/src/utils/partial-json.ts）：替代 partial-json npm 包（其 dist 内部 string-indexing 不可编译）——开括号栈扫描补全 + 部分字面量（true/false/null/NaN）补全 + 悬空键丢弃 + 有界截断重试；对照真包 11/12 等价（空输入 THROW 差异被 pi 调用方守卫+catch 覆盖）；json-parse.ts 切换，npm-static 降为仅 string_decoder。
- **SC2012/ImportMeta 清零**：auth/context.ts 与 env-api-keys.ts 的动态 node 导入改静态（浏览器兼容随静态目标失效）；paths.ts replaceAll 改 split/join；config.ts import.meta.url 改 `typeof __dirname` 守卫 + process.cwd() 回退（注意 TDZ：不能在模块里声明 const __dirname 又在函数里引用——t33 教训）。
- **output-guard.ts 重写**：stdout 猴子补丁（process.stdout.write 赋值）静态编译不可能 → 标志位 + 直接写 API（takeOverStdout/restoreStdout/isStdoutTakenOver/writeRawStdout/flushRawStdout 保留，waitForRawStdoutBackpressure 删除，2 个消费方清理）。行为差异：接管期间 console 写直通 stdout 不再重定向 stderr。
- **settings-manager**：new Set(iterable) 两处改 copySet 循环拷贝；部分 catch 绑定/动态键读残余待修。

## 收尾快照（续三）：326→320。AgentMessage 索引访问 union（CustomAgentMessages[keyof ...]）拍平为显式 5 臂 union（类型-only 环 types.ts↔harness/messages.ts 安全）——但探针二分发现诡异现象：**内联同构 5 臂 union 数组通过、AgentMessage 别名数组仍报 no static representation**（臂各自 p14-p18 全过）——别名解析/组合怪癖待下轮专查。SessionManager 单文件 standalone build 已 0 诊断。新增已验证模式：filter 类型谓词不可用 → `map(?? "")` + 布尔过滤；`Array.from(Set/Map.entries)` → 立即展开 / forEach+push；fs.globSync → 递归 readdir + mini-minimatch；precise→record 动态键读 → `as unknown as Record<string, unknown>` 双跳（t34 验证）；`in` on index-signature record 也不可用（改 `!== undefined`）。新增模式：`.filter((line): line is string => ...)` 类型谓词不可用 → `map(x ?? "")` + 布尔过滤；`Array.from(Set/Map.entries)` → 立即展开 / forEach+push；fs.globSync → 递归 readdir + mini-minimatch。package-manager 根因批次清完（24→长尾）。新增模式：**precise→record 双跳 cast**（`x as unknown as Record<string, unknown>` 解锁动态键读——单跳被拒、双跳可行且运行时正确 t34）；SettingsStorage 接口→抽象基类（类→接口参数墙同 TUI）；`in` over index-signature 不可用（连 index-signature record 也不行，改 `!== undefined` 读）；`migrateSettings` 返回 double-jump。settings-manager 剩 1 个 SC2003 union re-tag（deepMerge 复杂 union）+ 记录残余；print 模式 + --list-models 真跑健康。__dirname 在 scriptc ESM 目标被全面禁用（typeof 守卫也无效）→ moduleDirname 统一 dirname(process.argv[1])。消息树 any 第二波清扫（ToolResultMessage/AgentTool 默认 TDetails=unknown、tool_execution 事件精确类型）。session-manager 自身 standalone build 已通过（FileEntry[] 的'unknown 值'毒源随 CustomData 收口消除）；全图 SessionManager.open ×5 级联待复查（可能为图上下文差异）

## 已解决：AgentMessage 全展平（本轮）

实验确认假设：**union 臂不能是另一个 union 别名**（`AgentMessage` 含 `Message` 别名臂 → SC2011）。全展平为 7 臂显式 union（UserMessage/AssistantMessage/ToolResultMessage/4 自定义）后探针通过。类型-only 循环导入（types.ts ↔ harness/messages.ts）安全。

## 下轮首要任务：AgentMessage 别名怪癖

内联同构 union 数组通过但别名数组仍报 SC2011（探针二分确认臂各自全过）。首要假设：**union 臂中嵌套的 union 别名（Message）在 scriptc 的 interner 中不可重入**——即 union 不能引用另一个 union 别名作臂。验证法：探针 `(UserMessage | AssistantMessage | ToolResultMessage | BEM | CM | BSM | CSM)[]` 全展平应通过。若确认，修法 = AgentMessage 直接内联展开（或 Message 先展平为三臂 union 再组合）。波及：AgentMessage[] 出现的所有位置。

## 调试技术备忘：instrumented compiler（已落地，SC_DEBUG_FAIL=1 启用）

lowerer.ts 的 SC2011 触发点已内置 describe 分解树探针（env 门控、生产零开销）：对 dynamic-only 类型递归打印 OK/FAIL 树——数组下钻元素、union 下钻臂、record 下钻成员（`.name:`）。用法：
```
cd pi && PATH="$HOME/bin-node26:$PATH" SC_DEBUG_FAIL=1 node ../scriptc/packages/cli/dist/bootstrap.js build packages/coding-agent/src/cli.ts --npm-static string_decoder --out /tmp/pi-out 2>&1 | grep -A25 "SCDBG.*dynamic-only: <类型名>"
```
注意 scriptc/packages/compiler 的 dist 必须与 src 同步（改 src 后 `cd scriptc/packages/compiler && node node_modules/typescript5/bin/tsc -p tsconfig.json`）。

## 调试技术备忘：instrumented compiler（下轮首选）

黑盒试探低效；scriptc 编译器源码在 scriptc/packages/compiler/src，关键位置：
- `frontend/type-mapper.ts`（3808 行）：mapType/mapTypeInner（822/865，带 memo/深度上限）；union lowering（2596-2725）——**union 臂禁止 union/map/set/date/dyn/generator kind**（tagged-union 检查返回 null）、promise 臂仅当全为 promise+unit、jsval 臂吸收整个 union、dyn-collapse 走 dynSubsumableUnionArm；mapRecordType/mapRecordTypeInner（3220/3271）——index-signature 混合形态、accessor 规则（须 interface/type-literal 内且非 .d.ts）、recordProvenanceOk
- `frontend/lowering/lowerer.ts`：SC2011 requiresDynamicTypeDiag（3341）——static mapType null 但 dynamic 重跑成功时推送（"measured fact, not a guess"），PoisonError 中止
- **能力确认**：index-signature record 支持（string/number 键；值域含 unknown/函数/Maps/Sets/嵌套 record/RegExp——SC2006 注释）；`string & {}` 键按 string；union 臂逐个映射、unmappable 臂毒化整个 union（除非 jsval/dyn 吸收）；SC2005 泛型签名/SC2007 重载/SC2008 交叉各自有专属 fence
- **调试方法**：改 src 后 `cd scriptc/packages/compiler && node node_modules/typescript5/bin/tsc -p tsconfig.json` 重建 dist（CLI 走 dist，src 补丁必须重建才生效）；在 mapType/union/record 失败点插 `if (process.env.SC_DEBUG_FAIL) console.error(...)` + `SC_DEBUG_FAIL=1` 运行。**严禁**以 `return null;` 文本匹配批量插桩——会命中模板字符串内的文本破坏语法（本次事故：type-mapper 三处语法错，已还原 897df06 干净版）

## 揭幕完成（关键节点）：Model<any> → Model<Api> 后 320→416

这不是退步：any 类型成员原先让 scriptc 跳过整段分析（any 是 dynamic-only 毒源，含 any 的 record/函数直接进 island 通道，内部与下游全不检查）。换成 Model<Api> 后这些代码路径进入静态分析，暴露其真实诊断。**416 是全图首次"完全可见"的状态**——此后每个修复都是净减少，不会再有大幅揭幕。SC2020 的新增主要是 node:child_process/process.stdin/stdout 系（spawn 选项、writableLength）、Math.max、Array.from、Object.hasOwn 等 stdlib 长尾。

## 逐文件修复目录（416 → 0 的 grind 清单，每条均已定位到行号与修法）

### 通用修法（按 SC 码）
- SC1090 Set<Promise<T>>/.add/.delete/.size → `Promise<void>[]` 数组 + push/indexOf/splice
- SC2020 createInterface + for await（读 JSONL）→ readFileSync(0/路径) + split("\n") 逐行解析
- SC2020 Stats.mtime → 改读内容时间戳文件（同 mini-lockfile 手法）
- SC1090 .find on union array → for 循环 + 显式判别收窄（union re-tag 不支持）
- SC1090 'number' where 'string' → 检查读取点类型
- SC2020 replaceAll → split/join；codePointAt → charCodeAt（若仅 BMP）或保留探查
- SC2005 generic arrow inside function → 提升到模块作用域或类方法
- SC2003 union re-tag（成功回调 () => Promise<void> 流入 (session) => … 槽）→ 改签名形参/调用点
- SC2020 process.stdin/off/resume/setEncoding/writableLength → readFileSync(0) 或受支持事件面
- SC2020 Math.max/Object.hasOwn/Array.from/entries() → 手写循环或立即展开
- SC2020 fs.globSync → 递归 readdir + minimatch（package-manager 已做，可复制）
- SC2002 record 精确形状 → 双跳 cast / 显式字段字面量 / width-coerce 方向调整

### 文件清单（诊断数）
- rpc-mode.ts(75)：session.subscribe/agent.subscribe 方法调用、generic arrow 'success'、unknownCommand union re-tag、process.stdin.off、optional-param function value
- session-manager.ts(36)：Set<Promise> ×4、createInterface+for-await ×2、Stats.mtime、.find union、'number' where string、replaceAll、import()
- main.ts(23)：interactiveMode.init/stop/run 级联（interactive-mode 类解锁后消）、sessionManager.getCwd、AgentSession.model、process.stdout/stderr.writableLength
- package-manager.ts(20)：settings 动态键读 ×2、globSync、filter 谓词、Array.from ×2、entries()、child.stdout?.on ×2
- markdown.ts(16)：renderInlineTokens union 收窄残余、SC1042 mixed ||
- agent-session-runtime.ts(16)
- latex.ts(13)：codePointAt ×4 等
- settings-manager.ts(11)：SC2003 union re-tag（deepMerge）、catch binding、in 残余
- theme.ts(12)、print-mode.ts(11)、config-selector(9)、config.ts(8)、credential-print(8)、auth-check(8)、version-check(7)
- 其余 ≤6 的长尾

### 关键提醒
- 每修一批跑：tsgo --noEmit -p tsconfig.json（src 清零）+ coverage（确认净减）+ cli.ts -p 冒烟
- 揭幕不会再大规模发生（any 已清，全图可见）
- SC2004 级联：先修 SC1090/SC2002 根声明

### 三大 SC2002 簇（agent-session-runtime 16 / main 23 / session-manager 30 的主体）

1. **窄 record 参数收类实例**（agent-session-runtime.ts:151/333、main.ts:674）：参数类型 `{ getCwd: () => string; getSessionFile: () => string | undefined }`（SessionManager 的结构子集）收到 `SessionManager` 类实例 → 类→record 拷贝墙。修法：参数类型改 `SessionManager` 类引用（同 TUI 模式），或把这类"视图接口"改为 `Pick<SessionManager, "getCwd" | "getSessionFile">` 后仍走类引用（Pick of class = 类类型子集，scriptc 对类→类赋值走引用 ✓ 需验证）
2. **`{ has: (string) => boolean }` 收 Map**（session-manager.ts:1054/1067/1121）：`byId: Map<string, SessionEntry>` 传给 `Set<string>`-形参的 `has` 视图 → 改参数类型为 `Map<string, SessionEntry>` 或加薄适配
3. **`[string, string, string, string]` 元组收 string[]**（config-selector.ts:32）：`getConfiguredProviders()` 返回 string[]，声明改元组或调用点断言

### 通用修法（按 SC 码）

0. **TUI Component 接口 → 抽象基类重构**（本次会话最大剩余项）：scriptc 拒绝「类实例 → 接口(record) 参数」（t30 实验：copy 会丢原型方法与私有字段，直接判死）——TUI 全部 addChild(component)/children.push 都是此形态 ×~120。t31 实验已验证修复路径：①子类实例 → 抽象基类参数是引用语义 ✓（无拷贝）②泛型方法 `<C extends Comp>` ✓ ③可选方法字段调用必须先提升到局部变量（`const h = c.handleInput; if (h) h(x)`）④`in` 守卫在类实例上不可用（改 `!== undefined` 读 + cast）。具体做法：tui.ts 的 `interface Component` 改 `abstract class Component`（render/invalidate abstract、handleInput/wantsKeyRelease 可选字段），~30 个组件类 `implements Component` 改 `extends Component`，`interface TUI extends Component` 的对象字面量实现需单测（interface extends abstract class 的类型在 scriptc 下对待定 object literal 是否仍走 record 通道未验证）。
2. Set/Map 非基元元素（Set<TuiInputListener>/Set<SessionResourceCleanup>/Map<Api,…>/Map<keyof Settings,Set<string>>）→ 数组或 string 键 Map
3. runWithConcurrency（new Array(count)/Array.from/(()=>Promise<T>)[].length）泛型工具重写
4. keybindings/theme record 形状（expected '{ clear: string; copy: string; …}'——精确键 record）
5. SC2012：ai/auth/context.ts + env-api-keys.ts 变量 specifier import() 删除/改静态
6. settings-manager/session-manager/model-runtime 类方法级联（找类声明自身诊断）
7. node:module 三文件注入缝（pi-tui preflight），phase-6 收尾 + 构建脚本拆除 + 全量构建 + 冒烟（阶段 7）

## 当前进度

- [x] scriptc 环境搭建（pnpm install + pnpm -r build），hello world 编译链验证
- [x] pi 依赖安装、模型数据 hydration、全 workspace dist 构建
- [x] 基线 coverage/build 全量诊断拿到（6478/5779，265 个逐点诊断）
- [x] typebox 墙的 repro 实验与确认
- [x] 两处分析性小改：syntax-highlight.ts 加 `/// <reference>`；extensions/loader.ts 顶层探测延迟求值
- [x] 阶段 2 扩展系统移除（src 类型检查清零，build:offline 通过，llamacpp 真跑对话 OK）
- [x] 阶段 3 mini schema 库（运行时/类型层双重等价验证通过，全包构建 + 冒烟 OK）
- [x] 阶段 4 openai-completions fetch 化 + 内置 provider 清零（全链构建 + 真跑 OK）
- [x] 阶段 5 前置：跨包相对路径迁移（决策 B，src 全图直连 + 循环切断 + Node 直跑验证）
- [ ] 阶段 5 诊断清单批量修复（进行中；r46 后基线 **2**（34→2，99.7%），唯一残留 = models.ts publishProviderModels tail 簇，被 scriptc SC9001 ICE（Record<string,unknown> 双重注册）阻塞，修复形态已备，待编译器级修复，台账见第四十六轮记录）
- [ ] 阶段 6 --npm-static 收尾
- [ ] 阶段 7 全量构建 + 冒烟

## 阶段 2 记录（扩展系统移除）

**删除**：`core/extensions/`（runner/types/loader/wrapRegisteredTools 等全部）、`src/extensions/`（内置 inline 扩展）、`examples/extensions/`、photon 图片管线（photon.ts / exif-orientation / image-resize* / clipboard-image 的图片分支）、`test/` 下 29 个纯扩展/图片测试文件。

**迁移**：ToolDefinition 等共享类型 → `core/tools/tool-types.ts`（execute 去掉 ExtensionContext 参数）；bash 工具改用 `sessionEnvProvider` 闭包提供 PI_* 环境变量；read 工具改用 `modelProvider` 闭包判断非视觉提示；MarkdownTransformer/MarkdownTransformContext → `components/markdown-transform.ts`；ContextUsage/ToolInfo/TreePreparation → `core/agent-session.ts`；ProjectTrustUI/ProjectTrustContext 精简为 `{cwd, hasUI, ui{select,confirm,input,notify}}`。

**保留模式取舍**（用户要求：TUI 优先，print/RPC/JSON 除非极其麻烦都保留）——均已保留：print/json/rpc 只去掉扩展 UI 通道（RPC 的 extension_ui_request 协议、TUI 的扩展选择器 repurpose 为信任提示/确认对话框）；session_before_compact/before_tree/shutdown/start 等事件钩子全删，压缩回退到默认生成器。

**验证**：`tsgo --noEmit` src+examples+evals 清零（test/ 下约 40 个文件仍引用已删 API，留给用户按 AGENTS 约定自行处理）；`npm run build:offline` 成功（bundle 47 文件 6.7 MiB）；`cli.js --list-models` 三个 provider 齐全；llamacpp Qwen3.8-27B print 模式往返 OK。

## 阶段 3 记录（mini schema 库）

**关键发现**：

- pi 用的是独立包 `typebox` 1.3.7（不是 @sinclair/typebox），带 /value、/compile、/guard、/error 子路径导出；根入口是 `export * as Type from './typebox.mjs'` namespace 再导出 → SC1013 墙的根源
- typebox 1.x builder 运行时对象 = 普通 JSON + **非枚举**标记属性（`~kind`/`~optional`/`~unsafe`，Memory.Create 的 hidden set），所以 `JSON.stringify` 输出干净；旧 validation.ts 里检查 `Symbol.for("TypeBox.Kind")` 是 @sinclair 老版遗留——typebox 1.x 不挂这个 symbol，该条件恒为假（自定义 coercing 路径一直在跑）
- builder JSON 形状逐一确认：Object={type,required?,properties}（required 在 properties 前）、Record(String,X)={type:object,patternProperties:{"^.*$":X}}、Cyclic={$defs(每项+$id),$ref}、Literal={type,const}、Unsafe=原 schema+~unsafe 标记
- 真 typebox `Value.Check` 是**类型谓词** `value is Static<T>`（protocol/codec.ts 靠它收窄）；`Union` 参数是 rest 元组 `[...Types]` 保持精确元组推断——这两点不镜像会破坏类型层等价

**决定与原因**：

- 库放 pi-ai 新子路径 `@earendil-works/pi-ai/schema`（src/schema.ts 单文件、零内部依赖）；protocol 增加对 pi-ai 的 workspace 依赖。选这个方向因为除 protocol 外所有包都已依赖 pi-ai，pi-ai 不反向依赖 protocol（无环），根 build 顺序 ai 在 protocol 之前
- builder **声明返回真实 typebox brand 类型**（`import type`，编译期擦除、无运行时边）：`Static<typeof x>` 解析与替换前逐位相同，373 处调用点零改动，只换 import 来源
- 运行时 builder 写成对象字面量方法（scriptc 支持的多态形式）；validator 缓存挂在 schema 对象自身的非枚举属性上（绕开 WeakMap/Set/Map lowering 墙）
- 错误条目严格对齐 `TValidationError` 各 keyword 的 params 形状（requiredProperties/limit/allowedValue/additionalProperties...），message 措辞对齐实测输出（"must have required properties x"、"must not have fewer than N characters/items"）

**改动面**：

- 新 `packages/ai/src/schema.ts`（~600 行）：Type 15 个 builder（String/Number/Integer/Boolean/Null/Unknown/Literal/Object/Array/Union/Optional/Record/Ref/Cyclic/Unsafe）+ Compile(Check/Errors) + Value(Check 类型谓词 / Convert 原地强制转换，coercion 表与 pi 自定义路径一致) + Guard.IsDeepEqual
- 16 个文件 value import 换源：protocol(schemas/codec)、agent(reducer + 4 harness tools)、coding-agent(7 core tools + model-config + theme)、ai(index/validation/typebox-helpers)
- validation.ts 删 WeakMap 缓存（Compile 内部挂对象缓存等价替代）；ai/src/index.ts 的 `Type` re-export 改指本地模块，消除 pi-ai dist 根入口 → typebox 根的运行时边
- package.json：ai 加 `./schema` exports 条目；protocol dependencies 加 `@earendil-works/pi-ai`

**验证**：

- 运行时等价（node 脚本，real vs mini）：Object/Cyclic/Unsafe/Ref 结构 JSON 逐字节一致（含键序）、隐藏标记一致、Check 5 组对象用例 + 6 个 cyclic 值全部一致、Convert 3 组一致、IsDeepEqual 5 对一致
- 类型层等价：scratch 里 `Eq<Static<Real>, Static<Mini>>`（Object/Optional/Literal/Array+minItems/Union-literals/Record/Cyclic+Unsafe+Ref/additionalProperties:false）全 true；期间抓到并修复 Union 非 rest 元组参数导致推断退化成联合数组的问题
- `tsgo --noEmit`：src 清零（test/ 218 错为阶段 2 遗留，未动）；ai/protocol/agent/coding-agent 构建全过（bundle 47 文件 6.6MiB）
- 冒烟：`cli.js --list-models` 三 provider 齐全（models.json 解析走了 mini Compile.Check）；工具参数校验 + string→number 强制转换 OK；protocol 帧编解码往返 + 坏帧拒绝/粘滞失败态 OK

## 风险备注

- `--npm-static` 是实验性特性，剩余 npm 包逐个可能有意外（尤其 marked 18 / highlight.js），外围功能可砍可保
- TUI 的 `Intl.Segmenter`（词/字素分段）无 lowering，需要手写纯 TS 替代或降级为简单实现——影响编辑器光标词级移动体验，是 TUI 路径上最大的单项工作量
- pi 上游持续演进（tsgo、supply-chain 约束），本分支按"冻结一个版本做静态化"的思路进行
- mini schema 的 Convert 是自研实现（对齐 pi 现有双强制转换流的行为），不是 typebox 完整 Convert 的移植；若未来引入依赖 typebox Convert 高级行为（refine/codec/format）的工具 schema，需要回头补

## 阶段 4 记录（openai-completions fetch 化 + 内置 provider 清零）

**范围变更（2026-08-27 用户确认）**：模型来源从"deepseek/xiaomi/models.json 三个"简化为**只保留 models.json**，内置 provider 全部移除。当前 `~/.pi/agent/models.json` 只有 llamacpp（本地 OpenAI 兼容端点）；之前 --list-models 里的 deepseek/xiaomi/zai 都来自内置注册表数据（MODELS catalog），裁剪后只剩 models.json 条目。

**决定：裸 fetch + 自研 SSE，不用 llmstream**。对比结论：llmstream（v0.1.1，零依赖）的 LLMEvent 模型丢 reasoning_content（thinking 流式是 pi 核心特性）、usage 无 cache token（成本显示依赖它）、tool_call 内部累积不透传原始片段（pi 需要增量 partial-args + custom grammar buffer）、非 2xx 转 error 事件会断掉 retryProviderRequest 的 throw/duck-typed 重试链；保功能使用 = fork 重写。llmstream/parser.ts 仅作分帧行为参照。

**关键发现（SDK 语义对齐依据）**：

- openai SDK `buildURL`：`baseURL` 去尾斜杠 + `/chat/completions`
- 非 2xx → APIError：`{status, headers(Headers), error: body.error 解析对象, message: "${status} ${msg}"}`；pi 的 retryProviderRequest 只 duck-typed 探测（`"status" in error && headers instanceof Headers`，含 x-should-retry/retry-after-ms 解析），normalizeProviderError 只探测 `statusCode/status/body/error` 字段 → 自研错误对象带这三样即可全链零改动
- SSE 解码（SDK core/streaming.mjs）：按行切分、去尾 \r、空行派发事件、多行 data: 用 \n join、"data:" 前缀剥离一个空格、`[DONE]` 终止
- provider 接线图：`providers/all.ts` ← ai/cli.ts（--list-models）、ai/compat.ts、coding-agent/core/model-runtime.ts（含 radiusProvider 调用点）；models.json 条目经 `getApiProvider`（compat.ts，聚合全部 api lazy wrapper）按 api 名字解析实现；每个内置 provider .ts 引用自己的 `.lazy.ts` → 动态 import（scriptc 静态解析进图）

**已完成**：

- [x] `packages/ai/src/api/openai-http.ts`：streamOpenAIChatCompletions（fetch POST + 用户 signal/timeout 组合中止 + 非 2xx 错误形状对齐 SDK）+ sseJsonLines（TextDecoder stream:true、行状态机、多行 data join、[DONE]）
- [x] openai-completions.ts 换源：`import OpenAI from "openai"` → `import type`（namespace 类型 `OpenAI.Chat.Completions.*` 仍可用，tsgo 验证通过），createClient → createHttpTransport 产 `{url, apiKey, headers}`，请求调用切到 streamOpenAIChatCompletions（重试层零改动）
- [x] 验证：mock 端点 15 项断言全过（LF/CRLF 混用、comment 行、坏 JSON 帧跳过、400 错误形状 status/Headers/error/message、timeout、用户 abort）；**llamacpp 真跑**：print 模式对话往返 OK + bash tool_call 流式执行 OK
- [x] 内置 provider 文件删除（121 个文件，见下清单）+ compat.ts 瘦身为仅 openai-completions api-registry + faux + env-api-key 注入版

**已删清单备忘**：providers/ 下除 faux.ts 外全部（含 data/、images/）、api/ 下除 constrained-sampling|github-copilot-headers|lazy|openai-completions(.lazy)|openai-http|openai-prompt-cache|simple-options|transform-messages 外全部、根级 cli.ts(OAuth 登录 CLI)/oauth.ts/bun-oauth.ts/bedrock-provider.ts/images*.ts(4)/image-models.generated.ts/models.generated.ts/legacy-api-aliases.ts

**Checkpoint 收尾完成（2026-08-27）**，消费方适配与连带清理：

- model-runtime.ts：删 builtinProviderCatalog import、withRemoteCatalog 映射、configureRadiusProviders（create/refresh 两处调用 + 方法）、catalogBaseUrl option；providers 传空列表
- ai/src/index.ts：删 9 个已删 api 模块的 type re-export、images-models re-export、compat/extension-oauth-types OAuth 类型块
- types.ts：KnownApi/Api 联合保留不动（models.json 数据兼容）；删 9 个 option import，ApiOptionsMap 收窄到仅 `"openai-completions"`（未命中 api 回退 `StreamOptions & Record<string, unknown>`）
- compat.ts：streamSimple 里多余的 `as ModelsApiStreamOptions<TApi>` cast 删除——缺模块期间 typebox 之外的 import 失败把这些 option 类型 any 化，掩盖了 assignability 问题；修复 import 后浮出。参数本来就是 SimpleStreamOptions，直接传
- OAuth 类型迁移：extension-oauth-types 的 6 个类型（OAuthPrompt/OAuthAuthInfo/OAuthDeviceCodeInfo/OAuthSelectOption/OAuthSelectPrompt/OAuthLoginCallbacks）并入 auth/types.ts 经根入口导出，provider-composer 零改动；compat/ 子目录删除
- **额外连带清理**（checkpoint 计划外、tsgo 逼出来或同批孤儿）：
  - `ai/src/auth/oauth/` 全目录 11 文件（anthropic/radius/github-copilot/openai-codex/openrouter/kimi-coding/xai 流程 + load/pkce/oauth-page/device-code）：零活引用（load*/createRadiusOAuth 无人调用），且变量 specifier 动态 import 与 scriptc 静态编译原理冲突，「其他待删」清单里的 OAuth 流程提前在此清掉
  - `coding-agent/src/bun/`（cli/register-bedrock/restore-sandbox-env）+ package.json build:binary/copy-binary-assets 脚本：bun 二进制入口唯一职责是注册 bun-oauth + bedrock，均已不存在；原脚本还引用已删的 image-resize-worker.ts 与 photon wasm，本来就编不过
  - `coding-agent/src/core/remote-catalog-provider.ts`（pi.dev catalog overlay，孤儿）与 `core/radius.ts`（RADIUS_PROVIDER_ID 单行常量，零引用）
  - bundle 脚本 build-coding-agent-bundle.mjs：删 bedrock/oauth lazy 双构建机制（8 个 lazy 入口 + findContainingOutput 定位）；bundle 从 47 文件 6.6MiB 降到 **10 文件 3.7MiB**
  - ai/package.json：build/build:offline 改纯 `tsgo -p tsconfig.build.json`（原脚本跑 generate-models/check:model-data/cp providers/data，会重新生成已删的 models.generated.ts + providers/data 或直接失败）
- examples/sdk/12-full-control.ts：compat `getModel` → `modelRuntime.getModel(provider, modelId)`（models.json 驱动，MY_MODEL_PROVIDER/MY_MODEL_ID 环境变量可选覆盖）
- 根 tsconfig.json：删指向已删 src/oauth.ts 的 `@earendil-works/pi-ai/oauth` paths 条目
- **验证**：tsgo --noEmit 非 test 错误清零（test/ 599 行遗留不动）；根 build:offline 全链通过（tui→telemetry→ai→agent→sqlite-node→protocol→client→server→coding-agent）；`--list-models` 只剩 models.json 的 llamacpp 4 模型（Qwen3.8-27B/Qwen3.8-27B-MTP/Gemma-4-12B/Ornith-1.5-9B）；llamacpp Qwen3.8-27B print 模式真跑：对话往返 + bash tool_call 流式执行 OK
- **遗留提示（用户侧配置）**：`~/.pi/agent/settings.json` 的 enabledModels/modelThinkingLevels 仍引用已删内置 provider（deepseek/xiaomi/zai），启动会打 5 条 "No models match pattern" warning——属用户配置，未代改

## 阶段 5 进行中记录（决策 B：跨包相对路径迁移 + 新诊断基线）

**预调查结论（全量 --npm-static 实验）**：

- npm 静态编译实测：highlight.js / yaml / ignore / marked / string_decoder ✅ 通过；墙：diff、semver（CJS require 序围栏 SC1013）、proper-lockfile（→graceful-fs）、minimatch（→brace-expansion）、chalk（`#ansi-styles` imports 子路径缺失）、typebox（SC1013 namespace re-export，阶段 3 已证）、grok-mermaid（surface 推断断 → 按既定策略砍 mermaid）
- **workspace 包走 --npm-static 是死路**（沙箱实验证实）：opt-in 包的所有导入（含 `import type`）都被解析到 shipped JS（types stripped，resolve.ts 的 JS_ONLY_CONDITIONS），具名类型导出无法跨包边界传递——pi-ai 挂掉的 147 个导入点全是 Model/Api/Context 这类数据模型类型，拆成两条 import 也无效
- pi-tui preflight 整包拒绝：包内任一文件 import `node:module` 即退回 island（native-modifiers/native-module-path/terminal 三处 darwin/win32 原生加速器加载）

**决策 B（用户确认 2026-08-27）**：跨包裸导入改相对路径直指 src，workspace 变成同一个程序。已实施：

- 168 个文件 241 处 specifier 改写（全部包的 src + coding-agent examples），含 `declare module` 增强（TS 接受相对路径模块增强，tsgo 验证通过）；目标表 = 根 tsconfig paths 同构（pi-ai/compat/schema 等子路径逐一映射）
- 脚本误伤 6 处已修复：OFFICIAL_PACKAGE_NAME、PACKAGE_NAME（config.ts fallback）、TUI_PACKAGE_NAME（tui 包名常量）、vitest alias key ×2（client/server）、ai/index.ts 注释。教训：批量改写 import 必须排除非导入上下文的数据字符串
- session-share.ts radius 残留清理：`DEFAULT_RADIUS_GATEWAY` 导入指向已删文件却因 **stale dist**（旧 d.ts 未清，build 不 clean）被 tsgo 静默解析；改为 `provider.baseUrl`（models.json 驱动，getProvider("radius") 无 baseUrl 时直接 return false）
- SC1016 循环切断：agent-session-runtime → agent-session-services → sdk.ts →（`export * from "./agent-session-runtime.ts"`）→ 回环。删 sdk.ts 该行 re-export，index.ts 的 4 个 runtime 名 + 6 个 services 名改为从声明文件直接导入（其余内部消费方本就直接导入源文件）
- 全部 dist 目录已清（陈旧 d.ts 会掩盖失效导入，是类型检查陷阱）

**构建链简化（已验证部分）**：

- Node v26 type stripping 可直跑 `node packages/coding-agent/src/cli.ts`（--list-models 通过；全图无 enum/namespace 等非擦除语法）——冒烟不再需要 dist
- esbuild bundle 可直接吃 src（tsconfigRaw:{} 已配，无 rootDir 限制）
- per-package `tsgo -p tsconfig.build.json` emit 管线待正式拆除（根 build/build:offline 链 + 各包 package.json main/exports 指向），随阶段收尾一起做

**scriptc 新基线（全图直连后）**：691 个诊断 / 100 个文件 = SC2013×192（阶段 6 正主）+ 非 npm ×499。注意「613→1→691」的假象：中间那次 1 error 是 SC1016 循环在 preflight 阶段致命中止，隐藏了后续全部分析；循环修复后全图真实面才显现。密集文件 Top：package-manager-cli(96)、main.ts(87)、model-config(40，21×SC2011 any)、syntax-highlight(24)、theme(23)、session-selector(18，16×SC2002 record 形状)、first-time-setup(17×SC2002)、config-selector(18)、rpc-mode(16)、child-process(15，14×SC2020 node API)、tui/utils(13，6×SC1120 新码待查)。新增面：TUI 全源码、telemetry record 形状（SC2002×53）、ai/schema.ts 6 处（typebox 品牌类型溯源，决策 B 后需复测）。

**基线复现与 typebox 残留清理（2026-08-27 夜）**：

- 691 全量复现；逐码分布：SC2013×192、SC1090×177（综合码，变体见下）、SC2020×100、SC2004×62（声明级联，修根因即消）、SC2011×53、SC2002×53、SC2009×29、SC2003×9、SC2012×6（变量 specifier `import()`：ai/auth/context.ts + env-api-keys.ts，与静态编译原理冲突，待删/改）、SC1120×6（tui/utils 正则 v flag）、SC1100×2（unknown 传参需运行时校验 cast）、SC1063×1（catch 绑定）、SC1043×1（`!== null` 比较）
- SC1090 消息变体实测：method calls like 'X' ×84、assignment to non-variables ×23（`process.exitCode = 1`）、calling a function value with N args where lowered signature takes M ×13、constructing through a class value ×7、narrowing ×5、reading ×4、generic method no object literal ×4、object spread ×3、symbol-keyed writes ×2 等长尾
- 阶段 3 漏网最后一处 typebox **value** import：`agent/harness/tools/edit.ts`（16 个文件中唯一残留，其余均已切 mini）→ 换源 `ai/src/schema.ts`，-1 error。教训：当时“16 文件换源”没有全图 grep 收口

**scriptc 静态表示边界实验（scratch 对照法，/tmp/scx t1–t22）**：

- **npm d.ts 接口类型无 value 表示**：即使空接口，作为参数/返回类型即 SC2011/SC2013；该类型的值作实参传递同样被归罪“package X”；本地声明完全豁免。非导出内部 helper 里的 npm 类型不被检查（旧 schema.ts plainOptions(TSchemaOptions) 未被打标），但 exported 声明的签名必须全本地
- **cast 全部受形状检查**：index-signature record → 精确 brand 即使 `as unknown as` 双跳也被 SC2002 拒绝（“source's index signature could hold it at runtime”）；同句字面量含目标显式字段再 cast 可过 → 通用 `withKind<T>(schema: Record): T` 形态不可行，builder 必须逐方法直返字面量
- **record 存储的函数值丢失可选参数**：method shorthand/箭头带 `?` 参数一律 lower 成必填签名，零参调用 SC1090；**类方法**保留可选语义、泛型方法正确单态化、`export const Type = new Class()` 实例可表示 → builder 改类形态（调用点语法零变化）
- index signature 类型不能作函数值参数/返回（纯 optional 字段接口 OK）；顶层函数声明（含可选参）、`unknown` 参、泛型函数声明、类型谓词值函数、rest `[...T]` 参数均支持
- `Object.defineProperty` / `Object.hasOwn` 无 lowering；compiled 函数上的 `.call/.apply/.bind` 禁（SC1090，编译调用无 this/arguments 可重路由）；动态键读对异构字段精确 record 不可行、cast 成 Record 后 OK；`in` 运算符可用；`new RegExp(string)` 可用
- 类体成员间**没有逗号**（对象字面量语法惯性踩坑，tsgo/esbuild/解析器三方一致拒绝）
- tsgo（native-preview dev）偶发崩溃 `Target signature provides too few arguments` exit 2 无诊断输出，重跑即恢复，非代码问题

**schema.ts 重写（本地品牌 + SchemaBuilders 类）**：

- 本地镜像 PiString/PiNumber/PiInteger/PiBoolean/PiNull/PiUnknown/PiLiteral/PiObject/PiArray/PiUnion/PiOptional/PiRecord/PiRef/PiCyclic/PiUnsafe（字段形状与 typebox 1.x 严格一致，Static<> 按结构字段 XFromKeywords 匹配，解析结果同构）+ 无 index signature 的本地 options 接口（覆盖 pi 全部实传选项：description/minLength/maxLength/pattern/minimum/maximum/multipleOf/minItems/maxItems/additionalProperties）
- 导出 `PiSchema` 空接口基类（TSchema 镜像）；ai/index.ts 以名字 `TSchema` 再导出本地类型，外部消费方零改动；Tool(ai/types)/AgentTool(agent/types)/harness types/tool-types/create-harness 的泛型 bound+default 切本地 PiSchema；`TLocalizedValidationError` → 本地 `PiValidationError`（validation.ts + model-config.ts 换源）
- **类型层等价验证踩坑**：① required 字段必须是**元组**（TRequiredArray 语义）——非元组数组使 Static 静默退化（纯必填对象全变 optional；XStaticAnyOf 只匹配 `[infer L, ...R]` 元组模式，union 塌 never）；② Union 参数必须保留 `[...Types]` rest 形态，去掉则推断退化成联合数组 → protocol ClientMessage/ServerMessage Static 塌 never、client.ts 全红。Eq 对照（mixed/plain/all-opt 三形状）全 true
- typebox `TRequiredArray` 本身不可用：types-only import 照样被 scriptc 溯源 npm alias 判“does not compile”（SC2009）；自制本地 PiUnionToTuple 版又被 tsgo 以 TS2589 深度爆炸拒于 protocol/client → **未破**（见下墙 2）
- 验证状态：`tsgo --noEmit` 非 test 清零（test/ 604 行遗留不动）；`node packages/coding-agent/src/cli.ts --list-models` 运行时正常（llamacpp 4 模型，models.json 校验走新 Compile.Check）。当前工作区为 checkpoint 状态：类型层/运行时达标，scriptc 尚红（712，schema.ts 自身 99）
- scriptc：691→712——typebox 归罪的 37 SC2013 + 此前被短路隐藏的面消失，schema.ts 自身暴露 99 个新诊断（SC2020 defineProperty×1、SC2002 withKind cast×47、SC1090 泛型 Properties 动态键读×17、SC2009 条件类型成员×28）；新分布：SC1090×199、SC2013×157(npm)、SC2020×100、SC2002×100、SC2004×60、SC2009×56、SC2011×15、SC2003×9、SC2012×6、SC1120×6、SC1100×2、SC1063×1、SC1043×1

**三堵未破的墙（下一步正题）**：

1. **非枚举标记保不住**：defineProperty 无 lowering → ~kind/~optional/~unsafe 改可枚举普通赋值 + 序列化出口 `getJsonSchemaToolParameters` clone 时剥离 `~*`/`__piCompiledValidator` 键（wire JSON 相对上游多键，行为偏差待用户确认；strict 路径 structuredClone 保留自有属性不受影响）。备选：彻底不存 ~kind（运行时唯一读者是 Object builder 的 ~optional 探测），只留 ~optional
2. **泛型单态化后条件类型 alias 成员保持未求值**（SC2009）：PiLiteral.type 的条件字段与 PiObject.required 双双中招；required 的本地元组机制须同时满足 tsgo 深度预算（TS2589）与 scriptc 可求值性，张力未解。实验确认非泛型上下文里本地条件 alias 成员可编译 → Literal 或可改非泛型重载形态规避，待验证
3. **builder cast 模式重构**：弃通用 withKind，每 builder 改“显式字段字面量 + spread options + 单 cast”（t18 v2/v3 已验证）；Optional/Unsafe/Cyclic 的 cloneOwn 路径须在此形态下重做（clone 结果回 brand 的 cast 如何过 SC2002 待实验）

**待办（顺序）**：

1. schema.ts 三墙攻坚（上节 1–3）：标记可枚举化 + 出口剥离、builder 字面量直返重构、required/Literal 的条件类型成员形态定案；目标 schema.ts 自身 scriptc 清零
2. 阶段 5 正题：其余非 npm 诊断批量修（any→unknown、SC2020 node API 替代、record 形状对齐、SC1120 v flag 降 u flag、SC2003/SC2012 逐点）——注意修一处声明会消 SC2004 级联，按根因文件排批
3. pi-tui 三个 node:module 文件的程序内局部修复（原生加速器加载在 Linux 目标是死代码，注入缝 + no-op 默认）
4. 阶段 6：--npm-static 第三方逐个上墙验证，撞墙的自研 mini 实现或砍功能
5. 构建脚本正式拆除 + 全量构建 + 冒烟（阶段 7）
