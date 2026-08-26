// The out-of-scope builtin fences: modules a compiled binary is not going
// to serve say WHY — V8 introspection, the inspector protocol, the bundled
// SQLite engine, the deprecated domain module, and Node's underscore-
// prefixed implementation internals — while genuinely pending surface
// (stream/web here) keeps the plain not-yet wording.
import { getHeapStatistics } from "node:v8";
import { create } from "domain";
import { DatabaseSync } from "node:sqlite";
import { HTTPParser } from "_http_common";
import { open } from "node:inspector";
import { ReadableStream } from "node:stream/web";

console.log(getHeapStatistics, create, DatabaseSync, HTTPParser, open, ReadableStream);
