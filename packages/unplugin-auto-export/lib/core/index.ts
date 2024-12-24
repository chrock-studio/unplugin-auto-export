import { type WatchOptions, type ChildNode, watch, close } from "@chrock-studio/file-tree-watcher";
import { writeFileSync } from "node:fs";
import { Signal } from "signal-polyfill";
import { reaction } from "signal-utils/subtle/reaction";
import { type FormatterFn, formatter as defaultFormatter } from "./formatter";
import { join } from "node:path";
import { debounce } from "lodash-es";

export interface Options extends Omit<WatchOptions, "setup"> {
  /**
   * Paths to watch.
   *
   * @example ["src/components", "src/pages"]
   */
  paths: string[];
  /**
   * Formatter function to generate export statements.
   *
   * Default formatter:
   *
   * ```ts
   * (node: ChildNode) => `export * from "./${node.id}";` // for js or ts
   * (node: ChildNode) => `export { default as ${node.id} } from "./${node.id}";` // for other extensions
   * ```
   */
  formatter?: FormatterFn;
  /**
   * Output file name.
   *
   * Default output: `"index.ts"`
   */
  output?: string | ((node: ChildNode) => string);

  /**
   * Debounce time for writing to the index file.
   *
   * Default debounce: `100`
   *
   * Set to `0` to disable debounce.
   */
  debounce?: number;
}

// Filter out index files (index.ts, index.tsx, index.js, index.jsx, index.mjs, index.mts, etc.)
const indexReg = /^index\.m?(t|j)sx?$/;
const filterFn = (child: ChildNode) => {
  // If the child is a directory, it should have an index file.
  if (child.type === "dir") {
    return child.children.some((child) => indexReg.test(child.id));
  }
  // else, it should not be an index file.
  return !indexReg.test(child.id);
};

const compareFn = ({ id: a }: ChildNode, { id: b }: ChildNode) => a.localeCompare(b);

export const create = ({
  paths,
  formatter = defaultFormatter,
  output = "index.ts",
  debounce: debounceInterval = 100,
  ...options
}: Options) => {
  output = ((value: NonNullable<Options["output"]>) =>
    typeof value === "string" ? () => value : value)(output);

  const instance = watch(paths, {
    ...options,
    setup: (node) => {
      // Only handle directories.
      if (node.type === "dir") {
        const children = new Signal.Computed(() => node.children.filter(filterFn).sort(compareFn));

        const indexPath = join(node.$.fullpath, output(node));
        // debounce writeFileSync.
        let write = (value: string) => writeFileSync(indexPath, value);
        if (debounceInterval > 0) {
          write = debounce(write, debounceInterval);
        }

        return reaction(
          () =>
            // Generate export statements for all children.
            (children
              .get()
              .map((node) => formatter(node))
              .join("\n") || "export {};") + "\n",
          (nv, ov) => {
            // If the content is changed, write to the index file.
            if (nv !== ov) {
              write(nv);
            }
          },
        ); // Return the reaction to be disposed when the directory is removed.
      }
    },
  });

  return () => close(instance);
};
