// The cross-block merged-namespace fence, reached during COLLECTION: the
// collect-time trap probe on `var p = x` walks the initializer through
// resolveValueSymbol, which fences bare cross-block references (Node's
// transform throws ReferenceError where tsc's emit would qualify). At
// 0.0.10 the fence's PoisonError escaped the probe and crashed the CLI
// mid-discovery (5 merged-namespace corpus tests, ice bucket); the probe
// resolves side-effect-free now and the statement lowering owns the
// honest SC1090 below.
namespace M {
  export var x = 3;
}
namespace M {
  var p = x;
}
