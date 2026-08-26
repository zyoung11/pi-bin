// The net.Socket compat members on checked-dynamic handles: setNoDelay
// chains, pause()/resume() return the socket (and genuinely gate reads),
// write(chunk, cb)/end(chunk, cb) fire their callbacks off the sweep (cb
// after the bytes entered the buffer / the FIN went out), bytesWritten
// counts accepted bytes, readable flips at the read half's end,
// destroySoon tears down after the FIN, and dyn Buffer at()/slice()
// dispatch (slice COPIES — the documented no-views stance — and keeps
// the Buffer flavor). One connection, causally ordered lines; the pause
// guard fires once no matter how the chunks arrive.
'use strict';
const net = require('net');

function wrap(fn) {
  return function () {
    return fn.apply(this, arguments);
  };
}

const server = net.createServer(wrap(function (sock) {
  console.log('setNoDelay is sock:', sock.setNoDelay() === sock);
  console.log('readable pre:', sock.readable);
  sock.write('hello', wrap(function () {
    console.log('write cb, bytesWritten:', sock.bytesWritten);
  }));
  sock.end('!', wrap(function () {
    console.log('finish cb');
  }));
}));

server.listen(0, wrap(function () {
  const c = net.connect(server.address().port);
  let got = '';
  let pausedOnce = false;
  c.on('data', wrap(function (ch) {
    got += ch.toString('utf8');
    if (!pausedOnce) {
      pausedOnce = true;
      console.log('pause returns c:', c.pause() === c);
      setTimeout(wrap(function () { c.resume(); }), 20);
    }
  }));
  c.on('end', wrap(function () {
    console.log('client got:', JSON.stringify(got), 'readable:', c.readable);
    const dyn = wrap(function (b) { return b; });
    const buf = dyn(Buffer.from('abc\n'));
    const piece = buf.slice(0, 3);
    console.log('at(-1):', buf.at(-1), 'slice:', piece.length, piece[0], piece[2]);
    c.destroySoon();
  }));
  c.on('close', wrap(function () {
    console.log('client closed, destroyed:', c.destroyed);
    server.close();
  }));
}));
