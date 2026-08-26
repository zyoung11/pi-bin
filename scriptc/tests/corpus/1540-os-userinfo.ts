// os.userInfo(): the passwd-entry snapshot assembled field-by-field
// (username = pw_name, uid/gid = getuid/getgid, shell = pw_shell as the
// declared `string | null` union, homedir = pw_dir). Same machine, same
// user as the Node oracle, so every field byte-matches; key order is
// Node's insertion order (uid, gid, username, homedir, shell).
import * as os from "node:os";

const u = os.userInfo();
console.log(u.username, u.uid, u.gid);
console.log(u.homedir);
console.log(u.shell === null ? "null-shell" : u.shell);
console.log(Object.keys(u).join(","));
// The record is an ordinary value: fields flow into locals and templates.
const who = `${u.username}:${u.uid}`;
console.log(who === `${os.userInfo().username}:${u.uid}`);
console.log(typeof u.uid, typeof u.username);
