# pi-bin 改写与调试指南

> 面向对象：要把一个运行在 Node.js 上的大型 TypeScript 项目（本例：pi coding agent，~6 万行）改写为 **scriptc 100% 静态编译**（无 JS 引擎、无 --dynamic、原生 ELF）的实现者。
>
> 本文是实战沉淀，不是理论手册。所有规则都对应真实事故/真实诊断码，所有案例都来自本仓库的提交历史（哈希可查）。
>
> 配套阅读：`docs/static-pi.md`（逐轮作战记录）、`scriptc.dev/limitations`（官方限制面）。

---

## 0. 全景：你会遇到两类完全不同的 bug

| | 编译期（SC 码） | 运行时（trap / 内存安全） |
|---|---|---|
| 何时出现 | `scriptc build` 即报，带 file:line | 编译 0 诊断后，真跑才炸 |
| 表现 | SC1090/SC2002/SC2003/SC2009/SC2020/SC2011… | `sc_bad_key trap`、`array index N out of bounds`、`double free or corruption`、SIGSEGV、静默 no-op、返回垃圾值 |
| 根源 | TS 表面超出 scriptc 可 lowering 集合 | scriptc 的 lowering 语义与 JS 有偏差（生命周期/narrowing/拷贝语义），或源码 JS 时代被掩盖的越界 |
| 调试工具 | 诊断码 + 探针 + SC_DEBUG 插桩 | scr_trap_fmt backtrace、ASan 构建、gdb、PI_DBG 插桩、探针 |
| 修复方向 | pi 侧改写（本文第 3 节模式库） | 运行时防御改写（本文第 4 节模式库）+ 必要时报告编译器 bug |

**纪律**：两类 bug 的修复都必须让 `tsgo --noEmit` 保持 src 清零、scriptc build 保持 0 诊断——类型安全和静态编译是底线，运行时修复不允许引入新的编译期债。

---

## 1. 环境与命令（一次性背下来）

```bash
# 编译器要求 Node 24+；pi 的 PATH 默认 node 22，需要 shim
PATH="$HOME/bin-node26:$PATH"

# 编译（唯一 gate：0 error 才算过）
cd pi
node ../scriptc/packages/cli/dist/bootstrap.js \
  build packages/coding-agent/src/cli.ts \
  --npm-static string_decoder \
  --out /tmp/pi-out

# 类型检查（与 scriptc 并行的第二道门）
./node_modules/.bin/tsgo --noEmit

# 覆盖率分析（哪些 surface 还没编译、为什么）
node ../scriptc/packages/cli/dist/bootstrap.js \
  coverage packages/coding-agent/src/cli.ts --npm-static string_decoder

# 改了 scriptc 编译器源码后必须重建 dist（否则跑的是旧编译器！）
cd ../scriptc/packages/compiler && node node_modules/typescript5/bin/tsc -p tsconfig.json
```

要点：
- **scriptc 用自己的固定 compilerOptions（moduleResolution: Bundler），不读项目 tsconfig 的 paths**。环境声明 .d.ts 需要 `/// <reference>` 才进模块图。
- 编译器 dist 与 src 必须同步；给编译器加插桩后忘记 tsc 重建是最浪费时间的事故。
- **npm 依赖走 `--npm-static <pkg>` 白名单**；workspace 包一律相对路径直连源文件（`import ... from "../../tui/src/tui.ts"`），**绝不从 index.ts barrel 导入**（见 §3.1 双重类身份）。
- **冒烟测试必须在隔离 tmux pane**（`tmux new-session -d -s smoke ...`）。进程组 kill 类 bug 会波及宿主 pane（第 0e95a11 前的事故实锤）。

---

## 2. 编译期调试方法论

### 2.1 诊断码速查（含一句话解法）

| 码 | 含义 | 首选解法 |
|---|---|---|
| SC1090 | 表面不可 lower（方法调用/赋值/读取等变体，消息里带具体形式） | 按变体查 §3 模式库；最常见的是联合读→unknown 辅助、可选调用→提升守卫、getter→方法 |
| SC2002 | record 形状不匹配（width-coerce 失败） | 消息带 `— field 'x': ...` 时按字段修；不带时是残余，需插桩（§2.4） |
| SC2003 | union 不匹配（re-tag 失败） | 两臂字段类型必须完全一致（含 `\| undefined` 与否）；给所有臂补同型字段 |
| SC2009 | 容器（Map/Set/函数/类）内的值类型不可编译 | 查容器值域：Map 值禁 any/unknown/函数/**Set 值禁对象**；类字段禁 AbortController/Headers/unknown |
| SC2011 | 值无静态表示（any/unknown/接口等） | any→unknown→具体类型；接口值→类引用；**typed→unknown 赋值本身也被禁** |
| SC2012 | 走动态引擎的表面（parseFloat/replaceAll/toString(radix)…） | 手写替代（parseDecimalInt/split-join/charCodeAt），见 §4.2 |
| SC2020 | 标准库/@types/node 表面无 lowering | 查 §4.2 长尾清单；大量条目已有仓库内先例 |
| SC2008 | 交叉类型无 runtime shape | 拆成单接口（把交叉成员拍平合并） |
| SC2004 | 级联（声明被阻断，使用处连坐） | **不是独立 bug**——先修根声明，级联自动消 |
| SC1100/SC1101 | unknown/typed 的 cast 方向违规 | unknown→JSON 可表示形状 ✓；typed→unknown ✗（用具体辅助函数替代） |
| SC1013 | namespace re-export / barrel | 导入直连源文件（§3.1） |
| SC1120 | replace 回调函数值 | split/join 或手写循环 |

### 2.2 探针方法论（最快的定性与定位手段）

当诊断消息看不懂、怀疑是级联、或要验证某个写法是否可编译时，写探针：

```bash
# 探针文件放在目标包内（同包才能吃到相同的 declare module 增强）
packages/<pkg>/src/probeNN.ts
```

**探针铁律**（每条都是踩坑换来的）：
1. **必须导出 main 且被自身入口调用**——未导出/未调用的函数体被跳过，假阴性。
2. 探针必须**复刻真实数据形状**（外层 timestamp 是 ISO 字符串、内层是 number——测试数据写错形状会浪费整轮）。
3. **包含与目标文件相同的 declare module 增强**；跨包 type-only 探针会漏掉增强导致的类型差异。
4. 独立构建：`scriptc build packages/<pkg>/src/probeNN.ts --npm-static <deps> --out /tmp/probe`。
5. 探针里允许破坏运行时语义（只验证可编译性），但**不允许引入未验证的语法**（否则探针自身 SC0001 预检失败，白跑）。

探针二分示例（定位"哪个成员毒化了整个 record"）：
```ts
// 第一版：全量复刻真实结构 → 复现诊断
// 第二版：删掉一半字段/成员 → 过/不过 → 继续二分
// 每轮构建 ~10s（单文件），远快于全图 60s
```

### 2.3 SC_DEBUG 插桩（编译器内窥）

黑盒试探低效时，直接给编译器加插桩。已内置三个开关（`scriptc/packages/compiler/src` 内，env 门控）：

| 开关 | 用途 | 适用 |
|---|---|---|
| `SC_DEBUG_FAIL=1` | dynamic-only 类型的 describe 分解树（union 臂/record 成员逐层 OK/FAIL） | SC2011 类 |
| `SC_DEBUG_STRAND=1` | 枚举全部单元源 strand 生成点（运行时炸点构建期可见） | 运行时 strand trap |
| `SC_DEBUG_WIDTH=1` | record width-coerce 的逐字段 lift 失败明细 | SC2002 类（本仓库新增） |

改编译器 src 后**必须重建 dist**：
```bash
cd ../scriptc/packages/compiler && node node_modules/typescript5/bin/tsc -p tsconfig.json
```

⚠️ **严禁以 `return null;` 文本匹配批量插桩**——会命中模板字符串内的文本破坏语法（本仓库真实事故）。用唯一锚点 + 断言。

### 2.4 关键认知（避免无效调试）

- **SC2004 是级联不是 bug**：修掉根声明后自动消。按根因文件排批，不要逐条磨。
- **"揭幕"现象**：修掉一个毒源（any、交叉类型、双重类身份）会让下游真实诊断显形，**总量先升后降**。466→399 的曲线是正常预期，不要被吓退。
- **诊断的 expected/got 语义**：SC2002 的 expected = 目标（声明/注解侧），got = 源（字面量/变量侧）。但**箭头函数字面量的推断形状会被上下文类型化**——有时 expected 显示的是字面量推断而非声明。拿不准时看 SC_DEBUG_WIDTH 的逐字段输出。
- **tsgo 通过 ≠ scriptc 通过**；scriptc 通过 ≠ 运行时正确。三道门各自独立（见 §4）。
- **同仓库并行会话**：开工前先 `git log --oneline -10` 确认 HEAD，轮次记录以提交哈希为准。

---

## 3. 规范：如何参考 pi 原代码写 pi-bin 代码

pi 原代码是 Node 优先的 TS，大量使用 Node 生态惯用法（getter、Symbol 协议、barrel 导出、any、Node API）。改写不是翻译，而是**在保持功能等价的前提下，把类型表面收敛到 scriptc 可表示集合，把运行时行为收敛到防御式等价**。

### 3.0 总原则

1. **先读懂原实现的语义**（输入/输出/副作用/边界情况），再写；不做逐行翻译。
2. **类型表面为运行时服务**：scriptc 的 record 是单态 struct，一切"动态形状"都要降维成 `Record<string, unknown>` + 辅助函数。
3. **每写一个新文件，过一遍 §5 检查清单**，再进 tsgo/scriptc 双门。
4. **不改 scriptc 编译器**（路线 A）。编译器级 bug 用 pi 侧改写绕过，并记录供上游修复。
5. **大改动一律单 patch 单验证**：脚本批量替换一旦中途抛出，已完成部分丢失。

### 3.1 导入纪律

- **禁止 barrel/index 导入**（`import { X } from "./index.ts"`）。barrel 产生：
  - namespace re-export（SC1013）
  - **双重类身份**：同一类经 barrel 与直连两个模块身份实例化，跨身份赋值/构造全部 SC2002/SC2009（m80 vs m192 事故，58 文件迁移记录在案）
  - Keybindings 等 interface 增强（declare module）挂错模块
- 正确写法：
  ```ts
  // ✗ import { Component, Container, type TUI } from "../tui/src/index.ts";
  // ✓ 按符号逐一找到源文件：
  import { Component, Container, type TUI } from "../tui/src/tui.ts";
  import { Spacer } from "../tui/src/components/spacer.ts";
  import { ScrollView } from "../tui/src/components/scroll-view.ts";
  ```
- **type-only 符号必须标 `type`**：node type-stripping 对值导入做运行时校验（`SyntaxError: does not provide an export named 'X'`）。
- as 别名导入不能自动迁移——手动处理。

### 3.2 类型表面改写模式

| pi 原代码 | pi-bin 改写 | 原因 |
|---|---|---|
| `get columns(): number`（接口/类 getter） | `columns(): number` 方法 | getter 不参与 record 字段拷贝；接口 getter 不可映射 |
| `readonly [SYMBOL]()` / `readonly [SYMBOL] = true`（Symbol 协议） | 普通方法/普通字段 + 判别函数（`getLayoutNode()`、`getMode()`） | computed method/field 名不可 lower；Symbol 协议是 JS 鸭子类型惯用法 |
| `class A implements I`（接口有 getter/字段墙） | 构造器/字段参数直接用**类引用**（`A` 而非 `I`） | 类实例→接口参数是 width-coerce 墙 |
| `type X = A & { extra?: ... }`（交叉） | 单接口拍平（把 extra 成员并入 A 的定义）或独立接口 | 交叉类型无 runtime shape（SC2008） |
| `obj as unknown as SomeShape`（double-jump cast） | `unknown` 参数辅助函数 + `Record<string, unknown>` bracket 读 | 双跳 cast 目标含用户类字段/非 JSON 形状时被拒；辅助函数一次验证处处复用 |
| `x: any` | `x: unknown` + typeof 收窄，或具体 Record | any 是 dynamic-only 毒源；类字段 any → 整个类不可 lower |
| `new Map<K, V>()` V=函数/对象/Set | `Record<string, V>` bracket 读写，或 `V[]` 数组 + indexOf | Map 值禁 any/unknown/函数；Set 元素禁对象 |
| `Set<ComplexType>` | `ComplexType[]` + `includes`/`indexOf` | Set 元素只能 string/number |
| `new AbortController()` 存进类字段 | 适配器 record `{ signal: AbortSignal; abort: () => void }` | AbortController 类字段类型不可映射（AbortSignal 类字段同） |
| `Object.freeze(x)` | 删除（或恒等函数） | 无 lowering，且防御性冻结在静态产物中无意义 |
| `str.normalize("NFD")` | no-op 或手写常用分解表 | 无 lowering |
| `pathToFileURL(f).href` | `` `file://${f}` `` 或手写拼接 | URL 类不可映射 |
| `import { meta } from "node:os"` 动态取 | `process.platform` / `process.arch` / 删除 | typeof import union 不可映射 |
| `x as NodeJS.ErrnoException` | `asRecord(x)["code"]` bracket 读 | node 命名空间类型 cast 不可映射 |
| `barrel re-export` 的类/接口 | 直连源文件 | 见 §3.1 |
| `export const T = { ... }`（推断精确形状）+ 空数组成员 | `[] as KeyId[]` 显式化 + 显式注解 | 空数组推断 `(null\|undefined)[]` 毒化整个 record |

### 3.3 联合类型（union）专项

联合是 scriptc 的重灾区。核心规则：

1. **unionDisc（判别式字段读）要求所有臂的同名字段类型完全一致**——包括 `| undefined` 与否。给"缺字段的臂"补同型字段即可解锁：
   ```ts
   // ✗ inactive 臂无 overlay → reading 'overlay' on union 报错
   type S = { status: "inactive" } | { status: "eligible"; overlay: E } | { status: "blocked"; overlay: E; ... };
   // ✓ 三臂统一
   type S = { status: "inactive"; overlay: E | undefined } | { status: "eligible"; overlay: E | undefined; ... } | ...;
   ```
2. **空臂/void 臂禁入 union**（`void | Promise<void>` 同罪）。回调返回值一律 `=> void`。
3. **臂不能是另一个 union 别名**——需要时全展平为具名接口臂。
4. **联合上的字段读/方法调用不可靠时，降维为 unknown 辅助**（§4.1 模式 A）。
5. **显式联合注解的字面量构造会产生损坏 tag**（编译器 bug 实锤）——用无注解 push 或逐字段构造。

### 3.4 运行时纪律（编译通过 ≠ 运行时正确）

scriptc 的运行时语义与 JS 有系统偏差，以下是**全部已实锤**的偏差点及防御写法：

| # | 偏差 | 防御写法 |
|---|---|---|
| 1 | **typed record 缺键读 = trap**（JS 语义 undefined） | `recordViewOf` dyn 通道读，或 bracket 读 + `!== undefined` 守卫 |
| 2 | **数组越界读 = trap**（含 `[i+1]` 前瞻、`[length-1]` 负索引、`[0]` 空数组） | 循环前置 length 检查；`?? 不防越界` |
| 3 | **cast 视图（`this as unknown as X`）上的字段写 = 静默 no-op** | 直接字段写（去 readonly）或操作真实对象 |
| 4 | **数组值拷贝语义**：cast 视图的 push 是 no-op | fresh 数组 + 引用赋值（`output.content = blocks`） |
| 5 | **for-of + await 只执行首迭代**（异步 lowering 缺陷） | 逐 read 收集后 while + 索引派发 |
| 6 | **字符串生命周期 bug**：startsWith 三元/record 返回路径可产生损坏字符串 | charCodeAt 手写实现（stripBom 先例） |
| 7 | **switch union narrowing 的 re-tag 写越界**（堆损坏） | 渲染/热点路径全 dyn 化：`Record<string, unknown>` 签名 + `recordViewOf` + if 链判别 |
| 8 | **JSON.parse 裸动态记录无法 re-tag 进联合**（cast 后 typed 读必崩） | JSON 边界进联合的值必须**逐字段显式重建**（revive 反序列化器模式） |
| 9 | **函数值 record 的缺键读 = trap**（即使 TS 说可选） | `hasAction` 存在性检查 + 提升局部变量调用 |
| 10 | **node API 选项 record 的可选字段透传 undefined = 调用即抛** | 归一化默认值（`cwd: options.cwd ?? process.cwd()`） |
| 11 | **union 上下文的数组字面量被 lower 成 tuple**（运行时 strand 拒绝） | `[] as KeyId[]` 显式化 |
| 12 | **satisfies 保留窄字面量类型导致运行时 union re-tag 拒绝** | 改显式宽类型注解 |
| 13 | **静态构建 process.off 为 no-op**（信号监听器常驻） | 需要退出的路径显式 `process.exit` |
| 14 | **结束值来自 undefined 而非真实事件**（queue/cursor 模型缺陷） | event-stream 的 events+cursor 重写：done 值永远来自真实事件 |

---

## 4. 调试方法论（运行时）

### 4.1 模式 A：unknown 辅助函数（本仓库最高频的修复形态）

**适用**：联合字段读、动态键读、跨类型 duck-typing、JSON 边界。

```ts
// ✗ 联合字段读（SC1090）或运行时 typed 读 trap
if (config.type !== "grammar") return undefined;
const lark = config.variants.openai_lark;

// ✓ unknown 辅助函数：一次 cast、bracket 读、typeof 收窄
function readConfigType(config: unknown): string | undefined {
	const record = config as Record<string, unknown>;  // unknown→Record ✓
	const typeValue = record["type"];
	return typeof typeValue === "string" ? typeValue : undefined;
}
```

要点：
- **辅助函数参数必须是 `unknown`**——typed→unknown 的变量赋值也被禁（SC1101），但**把值作为实参传给 unknown 形参是唯一合法通道**。
- 辅助函数**必须非导出且被调用**（未调用函数体被跳过，假阴性）。
- `Record<string, unknown>` 的 bracket 读是全仓库验证过的最稳通道；写同理（`record[key] = value`）。

### 4.2 模式 B：stdlib 长尾手写替代

仓库内已沉淀的等价实现（复制即用）：
- `parseDecimalInt` / `parseDecimalNumber`（tui/utils.ts、provider-retry.ts）——替代 `Number.parseInt` / `Number.parseFloat`
- `imul`（ai/utils/hash.ts）——替代 `Math.imul`
- `codePointAt(text, index)`（tui/utils.ts、segmenter.ts、shell.ts）——替代 `string.codePointAt`（含代理对）
- `incompleteUtf8TailLength`（openai-http.ts）——替代 `TextDecoder(stream: true)`
- `parseHttpDateGmt` / `daysFromCivil`（provider-retry.ts）——替代 `Date.parse`
- `formatNumber`（interactive-mode.ts）——替代 `toLocaleString`
- `insertAt`（settings-selector.ts）——替代 `splice(i, 0, item)`
- RFC-1123 NFD——降级 no-op 或手写分解表（权衡后降级）
- `Object.hasOwn` → `record[key] !== undefined`；`Object.entries` → `Object.keys` + bracket 读；`Array.from(set)` → for-of + push；`new Set(values)` → 空构造 + add 循环；`Math.max(...arr)` → 循环；`Math.imul` → 手写；`replaceAll` → split/join

### 4.3 模式 C：渲染/热点路径全 dyn 化

**适用**：SIGSEGV/堆损坏/`double free` 的渲染路径（typed switch narrowing 的 re-tag 写越界是编译器级 bug，pi 侧绕过）。

案例（interactive-mode/markdown.ts，第五十二~五十三轮）：
```ts
// ✗ typed Token union 参数 + switch narrowing：传参拷贝损坏 13 臂 union、re-tag 写越界
function renderInlineTokens(tokens: Token[]): string { ... tokens[i].type ... }

// ✓ 全 dyn：unknown[] 签名 + recordViewOf bracket 读 + if 链判别
function renderInlineTokens(tokens: unknown[]): string {
	for (const tokenValue of tokens) {
		const token = tokenValue as Record<string, unknown>;
		const type = token["type"];
		if (type === "text") { const text = token["text"]; ... }
	}
}
```
全部调用点的 cast 改 `as unknown[]`；`tokens[i+1]` 前瞻读加 length 守卫。

### 4.4 模式 D：JSON 边界 revive（反序列化器）

**适用**：从磁盘/网络进来的裸 JSON 要进入 typed 联合。**JSON.parse 裸动态记录 cast 后直读必崩**（SIGSEGV/TypeError 双形态）。

```ts
// session-manager.ts reviveFileEntry（~380 行）：
// 10 种条目臂逐个判别 + 每个字段从 unknown dyn 通道读 + 显式重建
function reviveFileEntry(value: unknown): FileEntry { ... }
```
铁律：**JSON 边界进联合类型的值必须逐字段重建，永不 cast 后直读**。配套 `probe-crash.ts` 回归探针（复刻真实会话数据形状——外层与内层的 timestamp 类型不同）。

### 4.5 模式 E：事件流 done 值

**适用**：异步事件队列的结束信号。
- `done` 值永远来自**真实事件**（undefined 流动会导致 nullary narrow throw）
- queue 用 `events + cursor` 模型（push/next/end），splice/queue 模型会产生 undefined 流动
- `for-of + await` 只执行首迭代——SSE 循环改逐 read 收集 + while 派发

### 4.6 运行时调试工具链

```bash
# 1. 原生 backtrace（scriptc 内置）：gdb 拖慢时序掩盖竞态类 trap 时用它
#    （第五十五轮：scr_trap_fmt 加 execinfo backtrace，运行时 trap 直接打印函数符号）
# 2. ASan 构建（编译器 --sanitize）：堆损坏的精确定位
#    实例：Markdown_renderInlineTokens 4 字节写越界（第五十一轮）
# 3. PI_DBG_TOOL=1：工具参数打印插桩
# 4. gdb bt：非时序类崩溃的通用手段
gdb -batch -ex run -ex bt --args ./pi-native ...
# 5. 探针回归：崩溃修复后保留探针文件（probe-crash/probe48 等）防回退
```

时序敏感的竞态（如流式渲染 OOB）会被 gdb 拖慢掩盖——**先上 backtrace 插桩/ASan，再考虑 gdb**。

### 4.7 隔离纪律

- **冒烟/复现一律在隔离 tmux pane**：`tmux new-session -d -s smoke "cd ... && <cmd>"`。进程组 kill 类 bug 会波及宿主 pane（0e95a11 前的 pane 被杀事故）。
- **killProcessTree 已有双重护栏**：track 时验证 pgrp==pid（detached spawn 契约）、kill 前重验（pid 复用防御）。新增 spawn 路径必须走 `spawnProcess` 并 track。
- **原生二进制有内存 bug 时立即隔离**（重命名 `.QUARANTINE`），TUI 测试改 node 直跑（node 不受 C 后端内存 bug 影响）。

---

## 5. 新文件检查清单（进 tsgo/scriptc 双门前自查）

- [ ] 无 barrel/index 导入；type-only 符号标了 `type`
- [ ] 无 getter（接口与类）；Symbol 协议改普通方法
- [ ] 无交叉类型；无 `any`；类字段无 AbortController/Headers/unknown/函数值问题（函数值用 Record 而非 Map）
- [ ] 可选函数字段调用全部提升局部变量 + `!== undefined` 守卫
- [ ] Record bracket 读有 `!== undefined` 守卫；数组读有 length 前置检查（`?? 不防越界`）
- [ ] 无 `splice(i, 0, x)`（用 insertAt）；无 `replaceAll`/`toLocaleString`/`parseInt`（用手写替代）
- [ ] 无 spread-after-explicit（对象/数组字面量）；spread 只在字面量首位
- [ ] 联合臂字段同型（含 `| undefined`）；回调返回纯 `void`/纯 Promise
- [ ] JSON 边界值有 revive/显式重建
- [ ] node API 选项 record 无 undefined 透传
- [ ] 空数组字面量在联合/Record 上下文有 `as T[]` 显式化
- [ ] `satisfies` 未在需要运行时宽化的场景使用

---

## 6. 成功案例集（before/after）

### 案例 1：unknown 辅助函数替代联合字段读（armin.ts 彩蛋组件，28→0）

原代码（cast 到精确形状——Record→形状 cast 被拒，运行时 typed 读 trap）：
```ts
private effectState: Record<string, unknown> = {};

private tickTypewriter(): boolean {
	const state = this.effectState as { pos: number };   // ✗ SC2002
	if (state.pos >= DISPLAY_HEIGHT) return true;        // ✗ typed 读 trap
	...
}
```
改写（bracket 读 + typeof + 写回）：
```ts
private tickTypewriter(): boolean {
	const posValue = this.effectState["pos"];
	const startPos = typeof posValue === "number" ? posValue : 0;
	for (let i = 0; i < PIXELS_PER_FRAME; i++) {
		const pos = startPos + i;
		const row = Math.floor(pos / WIDTH);
		if (row >= DISPLAY_HEIGHT) return true;
		this.currentGrid[row][x] = this.finalGrid[row][x];
	}
	this.effectState["pos"] = startPos + PIXELS_PER_FRAME;
	return false;
}
```
七个 effect 函数全部同款改写，28 诊断清零。

### 案例 2：Map 值函数 → Record 动态键（custom-editor.ts）

```ts
// ✗ Map 值是函数不可映射（SC2009），连带整个类不可 lower
public actionHandlers: Map<AppKeybinding, () => void> = new Map();

// ✓ Record 动态键读写
public actionHandlers: Record<string, () => void> = {};
onAction(action: AppKeybinding, handler: () => void): void {
	this.actionHandlers[action] = handler;
}
handleInput(data: string): void {
	for (const action of Object.keys(this.actionHandlers)) {
		if (action === "app.interrupt" || action === "app.exit") continue;
		const handler = this.actionHandlers[action];
		if (handler !== undefined && this.keybindings.matches(data, action)) { handler(); return; }
	}
}
```
（AppKeybinding 字面量键作为 string 槽传入 ✓；缺键读有 hasAction 守卫——第五十轮 trap 修复。）

### 案例 3：Markdown 渲染管线全 dyn 化（第五十二~五十三轮，堆损坏根治）

typed Token union（13 臂）的传参拷贝损坏 + switch narrowing re-tag 写越界（ASan 实锤 4 字节写越界，编译器级 bug）：
```ts
// ✗
function renderInlineTokens(tokens: Token[]): string {
	for (const token of tokens) { switch (token.type) { case "text": ... } }
}
// ✓ 全 dyn
function renderInlineTokens(tokens: unknown[]): string {
	for (const tokenValue of tokens) {
		const token = tokenValue as Record<string, unknown>;
		const type = token["type"];
		if (type === "text") { const text = token["text"]; ... }
	}
}
```
配套：全部调用点 `as unknown[]`、`tokens[i+1]` 前瞻 length 守卫、`renderList/renderTable/trimPartialClosingFences` 同改。渲染管线零 typed union 边界。

### 案例 4：字符串生命周期（text.ts stripBom）

```ts
// ✗ startsWith 三元/record 返回路径触发字符串生命周期 bug（实证 corrupt JSON.parse 输入）
if (content.startsWith(BOM)) return content.slice(BOM.length);

// ✓ charCodeAt 手写
if (content.charCodeAt(0) === 0xfeff) return content.slice(1);
```

### 案例 5：SSE 循环的 for-of + await 首迭代缺陷（openai-http.ts）

```ts
// ✗ 异步 for-of 只执行首迭代（scriptc 异步 lowering 缺陷）
for (const chunk of chunks) { await onChunk(chunk); }

// ✓ 逐 read 收集 payloads 后 while + 索引派发
const collected: Chunk[] = [];
while (true) { const r = await reader.read(); ...; for (const payload of payloads) collected.push(payload); }
let i = 0;
while (i < collected.length) { await onChunk(collected[i]); i++; }
```
同轮：`finish_reason` 类型改 `string | null`（llama.cpp 对非终止 chunk 发 null，dynCheck 拒绝导致全部 chunk 被静默丢弃）。

### 案例 6：JSON 边界 revive 反序列化器（session-manager.ts，~380 行）

```ts
// ✗ JSON.parse 裸动态记录 cast 后 typed 读必崩（-c 路径 SIGSEGV）
const entries = lines.map((line) => JSON.parse(line) as FileEntry);

// ✓ 逐臂判别 + 每字段 unknown dyn 通道读 + 显式重建
function reviveFileEntry(value: unknown): FileEntry {
	const record = value as Record<string, unknown>;
	switch (record["type"]) {
		case "message": { const role = record["role"]; ... 10 臂 + 嵌套 AgentMessage 7 臂 + content 块 ... }
	}
}
```
1132 条真实会话全链路验证；配套 probe-crash.ts 回归探针（**复刻真实数据形状**——外层 timestamp 是 ISO 字符串、内层是 number）。

### 案例 7：insertAt 替代 3 参 splice（settings-selector.ts，13→2）

```ts
// ✗ splice 3 参无 lowering ×11
items.splice(index, 0, newItem);

// ✓ 手写插入
function insertAt<T>(items: T[], index: number, item: T): void {
	items.push(item);
	for (let i = items.length - 1; i > index; i--) items[i] = items[i - 1];
	items[index] = item;
}
```

### 案例 8：killProcessTree 双重护栏（shell.ts，pane 被杀事故）

```ts
function processGroupId(pid: number): number | null {
	try {
		const stat = readFileSync(`/proc/${pid}/stat`, "utf-8");
		const after = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
		return Number(after[1]);   // pgrp
	} catch { return null; }
}

export function trackDetachedChildPid(pid: number): void {
	if (processGroupId(pid) !== pid) return;   // detached 失效的子进程永不入组杀名单
	trackedDetachedChildPids.add(pid);
}

export function killProcessTree(pid: number): void {
	...
	// 组 kill 前重验：pid 死亡/复用时直接返回，绝不盲目组 kill
	if (processGroupId(pid) !== pid) return;
	process.kill(-pid, "SIGKILL");
}
```
背景：bash 工具短命子进程（echo）瞬间退出后 pid 被系统复用，清理时的组 kill 命中无关进程组——**hosting tmux pane 被杀的事故根因**。

### 案例 9：TuiForwarder（interactive-mode.ts）

原代码用 `new Proxy({}, { get/set/has/getPrototypeOf })` 实现"renderer 切换时组件持有的 TUI 引用保持稳定"。Proxy 无 lowering 且 getter 不参与 width-coerce：
```ts
// ✓ 手写委托类 implements TUI，34 个成员逐一转发
class TuiForwarder implements TUI {
	private readonly getTui: () => TUI;
	constructor(getTui: () => TUI) { this.getTui = getTui; }
	render(width: number): string[] { return this.getTui().render(width); }
	addChild(component: Component): void { this.getTui().addChild(component); }
	// ... 34 members
}
export function createInteractiveTuiReference(getTui: () => TUI): TUI {
	return new TuiForwarder(getTui);
}
```
配套：TUI 接口去字段化（mode/children/terminal/wantsKeyRelease/onDebug/fullRedraws → getMode()/getTerminal()/setOnDebug() 方法）——**getter 不参与 width-coerce 字段拷贝**的根因消除。

### 案例 10：Terminal 接口 getter → 方法（全仓迁移）

```ts
// ✗ 接口 getter 不可映射
export interface Terminal { get columns(): number; get rows(): number; get kittyProtocolActive(): boolean; }
// ✓ 方法
export interface Terminal { columns(): number; rows(): number; kittyProtocolActive(): boolean; }
```
ProcessTerminal 实现 + 6 文件全部调用点（`terminal.columns` → `terminal.columns()`）同步迁移——**接口/类改签名时的调用点迁移必须 grep 全仓（含非直观变量名接收者）**。

---

## 7. 收尾清单（每轮结束前）

1. `tsgo --noEmit` src 清零
2. `scriptc build` 0 诊断
3. 隔离 pane 冒烟：`-p` 对话 + bash tool_call + `--list-models`
4. TUI 真机验证项单独列出（需要用户配合）
5. 诊断/事故/新规则写入 `static-pi.md` 轮次记录
6. 探针文件要么删除、要么注释说明保留原因（回归探针）
7. `git commit`（逐轮原子提交，格式见 AGENTS.md）
