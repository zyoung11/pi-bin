'use strict';
/* The settings surface: getDefaultSettings, localSettings/remoteSettings
 * reads, session.settings(obj, cb) + the ack-driven callback, and the
 * remoteSettings event — the dyn (mustCall-shaped) lane. */
const http2 = require('http2');
function mustCall(fn) { return fn || function() {}; }
const defaults = http2.getDefaultSettings();
console.log('defaults.headerTableSize', defaults.headerTableSize === 4096);
console.log('defaults.enablePush', defaults.enablePush === true);
console.log('defaults.maxFrameSize', defaults.maxFrameSize === 16384);
const server = http2.createServer();
server.on('stream', (stream) => { stream.respond(); stream.end('ok'); });
server.listen(0, mustCall(function() {
  const client = http2.connect(`http://localhost:${this.address().port}`);
  console.log('local.enablePush-before', client.localSettings.enablePush === true);
  client.on('remoteSettings', mustCall((settings) => {
    console.log('remoteSettings-event', typeof settings.maxConcurrentStreams === 'number');
  }));
  client.settings({ enablePush: false, maxConcurrentStreams: 100 }, mustCall((err, settings) => {
    console.log('settings-cb err', err === null);
    console.log('settings-cb enablePush', settings.enablePush === false);
    console.log('local.enablePush-after', client.localSettings.enablePush === false);
    console.log('local.maxConcurrentStreams', client.localSettings.maxConcurrentStreams === 100);
    const req = client.request({ ':path': '/' });
    req.on('data', () => {});
    req.on('end', mustCall(() => { client.close(); server.close(); }));
    req.end();
  }));
}));
