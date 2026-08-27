# static-pi：用 scriptc 静态编译 pi（无 JS 引擎）

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

## 收尾快照（本日末次提交）：326 reached；print 模式 + --list-models 真跑健康。__dirname 在 scriptc ESM 目标被全面禁用（typeof 守卫也无效）→ moduleDirname 统一 dirname(process.argv[1])。消息树 any 第二波清扫（ToolResultMessage/AgentTool 默认 TDetails=unknown、tool_execution 事件精确类型）。session-manager 自身 standalone build 已通过（FileEntry[] 的'unknown 值'毒源随 CustomData 收口消除）；全图 SessionManager.open ×5 级联待复查（可能为图上下文差异）

## 阶段 5/6 剩余工作清单（按优先级）

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
- [ ] 阶段 5 诊断清单批量修复（进行中，新基线 691 个诊断见下方记录）
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
