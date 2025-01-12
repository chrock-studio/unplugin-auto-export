import type { ChildNode } from "@chrock-studio/file-tree-watcher";

// Filter out index files (index.ts, index.tsx, index.js, index.jsx, index.mjs, index.mts, etc.)
export const indexReg = /^index\.m?(t|j)sx?$/;
export const filter = (child: ChildNode) => {
  // If the child is a directory, it should have an index file.
  if (child.type === "dir") {
    return child.children.some((child) => indexReg.test(child.id));
  }
  // else, it should not be an index file.
  return !indexReg.test(child.id);
};
