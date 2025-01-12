import { type WatchOptions, type ChildNode, watch, close } from "@chrock-studio/file-tree-watcher";
import { writeFileSync } from "node:fs";
import { Signal } from "signal-polyfill";
import { type FormatterFn, formatter as defaultFormatter } from "./formatter";
import { join } from "node:path";
import { debounce } from "lodash-es";
import { effect } from "signal-utils/subtle/microtask-effect";

export interface Options extends Omit<WatchOptions, "setup"> {
  /**
   * Paths to watch.
   *
   * @example ["src/components", "src/pages"]
   */
  paths: string[];
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
   * Custom builder function to generate `index` file content.
   *
   * Default builder:
   *
   * ```ts
   * (children: ChildNode[], current: ChildNode) => children.map((node) => formatter(node)).join("\n") || "export {};") + "\n"
   * ```
   */
  builder?: (children: ChildNode[], current: ChildNode) => string;

  onContentChange?: (node: ChildNode, nv: string) => void;
}
namespace Options {
  export const hasFormatter = (
    options: Partial<Options>,
  ): options is Required<Pick<Options, "formatter">> => {
    return "formatter" in options && typeof options.formatter === "function";
  };

  export const hasBuilder = (
    options: Partial<Options>,
  ): options is Required<Pick<Options, "builder">> =>
    "builder" in options && typeof options.builder === "function";
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
  output = "index.ts",
  debounce: debounceInterval = 100,
  onContentChange,
  ...options
}: Options) => {
  output = ((value: NonNullable<Options["output"]>) =>
    typeof value === "string" ? () => value : value)(output);
  const builder = Options.hasBuilder(options)
    ? options.builder
    : (() => {
        const formatter = Options.hasFormatter(options) ? options.formatter : defaultFormatter;
        return (children: ChildNode[]) =>
          (children.map((node) => formatter(node)).join("\n") || "export {};") + "\n";
      })();

  const instance = watch(paths, {
    ...options,
    setup: (node) => {
      // Only handle directories.
      if (node.type === "dir") {
        const children = new Signal.Computed(() => node.children.filter(filterFn).sort(compareFn));

        const indexPath = join(node.$.fullpath, output(node));
        let removed = false;
        // debounce writeFileSync.
        let write = (value: string) => {
          if (removed) {
            return;
          }
          writeFileSync(indexPath, value);
        };
        if (debounceInterval > 0) {
          write = debounce(write, debounceInterval);
        }

        const content = new Signal.Computed(
          () => !!children.get().length && (builder(children.get(), node) || "export {};\n"),
        );

        const stop = effect(() => {
          const nv = content.get();
          if (!nv) {
            return;
          }
          onContentChange?.(node, nv);
          write(nv);
        });

        return () => {
          removed = true;
          // Stop the reaction when the directory is removed.
          stop();
        };
      }
    },
  });

  return () => close(instance);
};
