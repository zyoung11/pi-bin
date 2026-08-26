// Drives the res-surface server: the status LINE (code + reason phrase)
// per route, the CRUD echo headers, the flat-array head's repeated name
// (an array on this side), the joined duplicate request header, then
// /quit. The raw status line for /chain and /props comes from
// res.statusMessage — Node's parsed reason phrase.
import { request } from "node:http";

const port = Number(process.argv[2]);

function get(path, headers) {
  return new Promise((resolve) => {
    const req = request({ host: "127.0.0.1", port, path, method: "GET", headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        resolve({ status: res.statusCode, msg: res.statusMessage, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") });
      });
    });
    req.on("error", () => resolve({ status: -1, msg: "error", headers: {}, body: "" }));
    req.end();
  });
}

const chain = await get("/chain");
console.log(`/chain -> ${chain.status} "${chain.msg}" x-a=${chain.headers["x-a"] ?? "-"} body=${chain.body}`);
const arr = await get("/array-head");
const list = arr.headers["x-list"];
console.log(`/array-head -> ${arr.status} x-list=${Array.isArray(list) ? list.join("|") : (list ?? "-")} body=${arr.body}`);
const props = await get("/props");
console.log(`/props -> ${props.status} "${props.msg}" body=${props.body}`);
const crud = await get("/crud");
console.log(
  `/crud -> ${crud.status} got=${crud.headers["x-got"] ?? "-"} had=${crud.headers["x-had"] ?? "-"} after=${crud.headers["x-has-after"] ?? "-"} x-b=${crud.headers["x-b"] ?? "-"} body=${crud.body}`,
);
const dup = await get("/dup", ["x-dup", "a", "x-dup", "b"]);
console.log(`/dup -> ${dup.body}`);
const quit = await get("/quit");
console.log(`/quit -> ${quit.body}`);
console.log("driver done");
