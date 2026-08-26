// @dynamic
// import() of a package whose runtime resolution Node REFUSES (the
// exports target ./index.js does not exist — the shipped .d.ts satisfies
// tsc, so the program typechecks): never a build error — Node evaluates
// the import() and REJECTS it with ERR_MODULE_NOT_FOUND, and the embedded
// refusal trap reproduces exactly that.
import("brokenrt")
  .then(() => {
    console.log("resolved?!");
  })
  .catch((e: unknown) => {
    if (e instanceof Error) {
      console.log("shape:", e.message.startsWith("Cannot find module"));
      console.log("names target:", e.message.includes("brokenrt"));
    }
  });
