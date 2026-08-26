import "order-c";

// Runs after order-a (the entry imported it first) and after order-c (this
// module's own import) but before order-b.
console.log("mid init");
export const midMarker = "mid";
