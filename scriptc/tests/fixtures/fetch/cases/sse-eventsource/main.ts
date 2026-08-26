// @dynamic
// The AI-SDK streaming shape end-to-end: a chunked SSE response consumed
// through TextDecoderStream → EventSourceParserStream (the real
// eventsource-parser package, embedded), byte-exact vs Node.
import { runSse } from "ssefetch";

runSse(process.argv[2]);
