// Lazy edge semantics under --dynamic, differentially against Node: the
// embedded graph carries require() and import() edges that CANNOT resolve
// (missing packages, missing relative files) plus never-called ones — the
// build must SUCCEED (Node links only the static graph; require fails at
// the call, import() at evaluation) and every executed probe must print
// Node's exact error shape: MODULE_NOT_FOUND with the live Require stack
// for require(), ERR_MODULE_NOT_FOUND (with the file:// url for relative
// targets) for import(). Repeat calls pin the retry semantics: a module
// whose evaluation throws leaves no cache entry, so require throws EVERY
// time (never an empty exports object on the second call). The chain and
// subgraph probes pin the TRANSITIVE semantics: modules that exist but
// whose own edges are broken fail at the lazy boundary that reaches them
// — a top-level require inside a required file, a static import inside an
// import()ed subgraph.
import { probeMissingPkg, probeMissingRel, probeDeep, probeChain } from "lazyzoo";
import { probeBare, probeRel, probeSubgraph } from "esmghost";

async function run(): Promise<void> {
  const missingPkg: string = probeMissingPkg();
  console.log(missingPkg);
  const missingPkgAgain: string = probeMissingPkg();
  console.log(missingPkgAgain);
  const missingRel: string = probeMissingRel();
  console.log(missingRel);
  const deep: string = probeDeep();
  console.log(deep);
  const chain: string = probeChain();
  console.log(chain);
  const chainAgain: string = probeChain();
  console.log(chainAgain);
  const bare: string = await probeBare();
  console.log(bare);
  const bareAgain: string = await probeBare();
  console.log(bareAgain);
  const rel: string = await probeRel();
  console.log(rel);
  const subgraph: string = await probeSubgraph();
  console.log(subgraph);
  const subgraphAgain: string = await probeSubgraph();
  console.log(subgraphAgain);
}
run();
