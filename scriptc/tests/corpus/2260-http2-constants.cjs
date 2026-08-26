/* http2.constants — the baked-literal table (240 members, Node v24):
 * every access spelling the suite uses reads its literal — the CJS
 * namespace chain, the destructure (renames included), the inline
 * require chain, and a function-scoped require destructure. The object
 * itself never materializes; bare value uses fence. */
'use strict';
const http2 = require('http2');

// The destructure shape (21 suite tests): plain names and a rename.
const { NGHTTP2_CANCEL, NGHTTP2_REFUSED_STREAM, HTTP2_HEADER_PATH: headerPath } = http2.constants;
console.log(NGHTTP2_CANCEL, NGHTTP2_REFUSED_STREAM, headerPath);

// The chained namespace read.
console.log(http2.constants.HTTP2_METHOD_GET, http2.constants.HTTP_STATUS_TEAPOT);
console.log(http2.constants.NGHTTP2_ERR_FRAME_SIZE_ERROR, http2.constants.NGHTTP2_SESSION_SERVER);

// Strings and numbers mix; error-code family, header family, status family.
console.log(http2.constants.HTTP2_HEADER_CONTENT_TYPE, http2.constants.NGHTTP2_PROTOCOL_ERROR);
console.log(http2.constants.HTTP_STATUS_NETWORK_AUTHENTICATION_REQUIRED);

// A function-scoped require().constants destructure (the suite nests these).
function innerCodes() {
  const { NGHTTP2_INTERNAL_ERROR, NGHTTP2_ENHANCE_YOUR_CALM } = require('http2').constants;
  return NGHTTP2_INTERNAL_ERROR + NGHTTP2_ENHANCE_YOUR_CALM;
}
console.log(innerCodes());

// Constants feeding expressions and comparisons, the suite's usage shape.
const code = http2.constants.NGHTTP2_NO_ERROR;
if (code === 0) console.log('NO_ERROR is zero');
console.log(`path header is ${headerPath}`);
