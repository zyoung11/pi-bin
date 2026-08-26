// Decorators are declaration-time CALLS — Node runs them when the class
// statement evaluates (and they may replace the declaration), whether or not
// anything references the class, so every fence here reports EAGERLY. CLASS
// decorators with one concrete (class) => class-or-void signature lower
// statically, and AMBIENT decorator names compile to Node's ReferenceError
// crash (corpus 1970-1973); everything else is a named fence, never a
// silently dropped decorator (the sibling-shape sweep's
// staticInitializersAndLegacyClassDecorators finding).

// MEMBER decorators stay fenced by kind — method, accessor, field,
// auto-accessor — the standard context object and member replacement have
// no static story.
function mdec(method: () => number, context: ClassMethodDecoratorContext): void {}
function fdec(value: undefined, context: ClassFieldDecoratorContext): void {}
function adec(target: ClassAccessorDecoratorTarget<unknown, number>, context: ClassAccessorDecoratorContext): void {}
function gdec(getter: () => number, context: ClassGetterDecoratorContext): void {}
class MemberDecorated {
  @mdec
  m() {
    return 2;
  }
}
class FieldDecorated {
  @fdec
  f: number = 1;
}
class AutoAccessorDecorated {
  @adec
  accessor a = 1;
}
class GetterDecorated {
  @gdec
  get g(): number {
    return 3;
  }
}

// The standard 'context' parameter (addInitializer, metadata) has no static
// lowering — single-parameter class decorators compile.
function withCtx(t: typeof Ctx, context: ClassDecoratorContext): void {}
@withCtx
class Ctx {}

// A generic class declares once in JS but compiles per instantiation — no
// single decoration event exists.
function anyClass(t: unknown): void {}
@anyClass
class GenericBox<T> {
  v!: T;
}

// tsc's STRUCTURAL check admits replacements the nominal classval world
// cannot rebind: Impl is a sibling of Decorated (both extend Root), so the
// returned value is no classval of Decorated.
class Root {
  speak(): string {
    return "root";
  }
}
class Impl extends Root {
  speak(): string {
    return "impl";
  }
}
function pickImpl(t: typeof Root): typeof Root {
  return Impl;
}
@pickImpl
class Decorated extends Root {
  speak(): string {
    return "decorated";
  }
}

// A REPLACING decorator rebinds the name, so a compiled subclass (base
// pointer, vtable prefix, interval fixed at build time) cannot extend it.
function identity(t: typeof ReplacedBase): typeof ReplacedBase {
  return t;
}
@identity
class ReplacedBase {}
class BelowReplaced extends ReplacedBase {}
new BelowReplaced();

// A return type mixing the class with undefined would need the runtime
// undefined-keeps-the-original check — a named fence, not a wrong binding.
function maybe(t: typeof Sometimes): typeof Sometimes | undefined {
  return undefined;
}
@maybe
class Sometimes {}

// An AMBIENT decorator on a MEMBER makes the whole declaration a
// guaranteed-throw shell (the corpus's dominant decorator shape — the
// class statement crashes at the decorator-expression read). The class
// compiles to exactly that crash; VALUE uses fence — the binding
// provably never initializes.
declare let ambientDec: any;
class ShellDoomed {
  @ambientDec
  m() {
    return 1;
  }
}
new ShellDoomed();
const shellVal = ShellDoomed;
class UnderShell extends ShellDoomed {}
