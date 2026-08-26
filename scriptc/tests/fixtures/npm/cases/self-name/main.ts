// @dynamic
// An embedded package whose internal modules import the package by its
// own published name — the builder's PACKAGE_SELF_RESOLVE rule (Node
// checks self-reference BEFORE any node_modules lookup): the package is
// installed under a DIFFERENT directory name ("aliased"), so only the
// self-reference rule can resolve "selfref" from inside it.
import { combined } from "aliased";

console.log("self-name:", combined());
