/* dns.lookup over the namespace import (portless's form): 'localhost'
 * with { family: 4 } resolves to 127.0.0.1 through /etc/hosts (no
 * external DNS), an .invalid name delivers Node's ENOTFOUND error shape,
 * deliveries stay async (both "queued" lines print first) and arrive in
 * call order. The error-path address argument is deliberately not
 * printed — Node passes undefined where the string slot here holds ""
 * (SEMANTICS.md). */
import * as dns from "node:dns";

dns.lookup("localhost", { family: 4 }, (err, address) => {
  if (err) {
    console.log("localhost failed:", err.message);
    return;
  }
  console.log("localhost ->", address);
});
dns.lookup("host-that-cannot-exist.invalid", { family: 4 }, (err) => {
  if (err) {
    console.log("invalid failed:", err.message);
    return;
  }
  console.log("invalid unexpectedly resolved");
});
console.log("queued");
