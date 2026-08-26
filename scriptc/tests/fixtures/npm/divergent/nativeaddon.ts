// @dynamic
// The native-addon trap: a napi-style package require()s its .node
// binding lazily (rolldown/oxc/keyring's shape). Node process.dlopen()s
// the file — the fixture's is garbage, so Node fails with a PLATFORM
// message; the island has no dlopen at all, so the build embeds a
// throwing ERR_DLOPEN_FAILED stub instead of the addon's machine code
// (28MB of Mach-O in rolldown's case — the binary-size fix is the
// semantics fix). Both lanes throw an Error carrying ERR_DLOPEN_FAILED
// at the call, but the message text is platform-worded under Node, so
// this program is asserted directly, never differentially. The repeat
// call pins the retry semantics (a throwing module leaves no cache
// entry); the extensionless probe pins ".node" in the require candidate
// list; the message probe pins the island's exact wording.
import { probeAddon, probeAddonAgain, probeExtensionless, probeMessage } from "nativezoo";

console.log(probeAddon());
console.log(probeAddonAgain());
console.log(probeExtensionless());
console.log(probeMessage());
