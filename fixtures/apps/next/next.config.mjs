// Static export: `next build` still server-renders every page, so importing the plugin on the
// server (no window/document) is covered, and the output can be served as plain files.
export default { output: 'export' };
