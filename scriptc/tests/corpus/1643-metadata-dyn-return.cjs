'use strict';
// The suite harness's parseTestMetadata shape end to end: JS bindings that
// evolve through checked-dynamic types (`let flags = []` — any[], and
// `let envs = {}` — TS's everything-assignable empty-object type, both
// dyn locals), reassigned from split/filter and Object.fromEntries, then
// returned through a JSDoc-typed record boundary and DESTRUCTURED at the
// call site.
const { inspect } = require('util');

/**
 * @param {string} source
 * @returns {{ flags: string[], envs: Record<string, string> }}
 */
function parseTestMetadata(source) {
  const flagStart = source.search(/\/\/ Flags:\s+--/) + 10;
  let flags = [];
  if (flagStart !== 9) {
    let flagEnd = source.indexOf('\n', flagStart);
    if (source[flagEnd - 1] === '\r') {
      flagEnd--;
    }
    flags = source
      .substring(flagStart, flagEnd)
      .split(/\s+/)
      .filter(Boolean);
  }

  const envStart = source.search(/\/\/ Env:\s+/) + 8;
  let envs = {};
  if (envStart !== 7) {
    let envEnd = source.indexOf('\n', envStart);
    if (source[envEnd - 1] === '\r') {
      envEnd--;
    }
    const envArray = source
      .substring(envStart, envEnd)
      .split(/\s+/)
      .filter(Boolean);
    envs = Object.fromEntries(envArray.map((env) => env.split('=')));
  }

  return { flags, envs };
}

const withBoth = '// Copyright\n// Flags:  --expose-internals --no-warnings\n// Env: FOO=bar BAZ=a=b\nrest\n';
const { flags, envs } = parseTestMetadata(withBoth);
console.log(inspect(flags));
console.log(inspect(envs));
console.log(Object.keys(envs).some((key) => key === 'FOO'));
console.log(Object.keys(envs).map((key) => key + '=' + envs[key]).join(','));

const neither = parseTestMetadata("'use strict';\nconsole.log(1);\n");
console.log(neither.flags.length, Object.keys(neither.envs).length);

const crlf = parseTestMetadata('// Flags: --a --b\r\n// Env: X=1\r\nrest\r\n');
console.log(inspect(crlf.flags), inspect(crlf.envs));
