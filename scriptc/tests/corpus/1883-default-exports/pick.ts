// `export { x as default }`: a named const becomes the default binding —
// pure alias plumbing on both sides.
const chosen = 41;
export { chosen as default };
