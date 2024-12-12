import fs from "node:fs";
import * as chokidar from "chokidar";
import { FileContext } from "./utils/FileContext.js";
import { type ChildNode, DirectoryNode } from "./node/index.js";

export interface SetupFn {
  /**
   * Setup the node. This function is called when the node is created.
   *
   * If the function returns a function, it will be called when the node before it is destroyed.
   *
   * @param node The node to setup
   * @returns A function to cleanup the setup
   */
  (node: ChildNode): void | (() => void);
}

export interface WatchOptions extends chokidar.ChokidarOptions {
  setup?: SetupFn;
}

export interface Watching {
  node: DirectoryNode;
  watcher: chokidar.FSWatcher;
}

export const watch = (
  paths: string[],
  { setup, ...options }: WatchOptions = {}
) => {
  return Object.fromEntries(
    paths.map<[string, Watching]>((path) => {
      const stat = fs.statSync(path);
      if (!stat.isDirectory()) {
        throw new Error("The path must be a directory: " + path);
      }

      const context = FileContext.parse(path);
      const node = new DirectoryNode(context.basename, context, stat, setup);
      const getRelativePath = (fullpath: string) =>
        fullpath.replace(`${path}/`, "");

      const add = (watched: string, stat: fs.Stats) => {
        if (watched === path) {
          return;
        }
        node.add(getRelativePath(watched), stat, setup);
      };
      const change = (watched: string, stat: fs.Stats) => {
        node.update(getRelativePath(watched), stat);
      };
      const remove = (watched: string) => {
        if (watched === path) {
          DirectoryNode.destroy(node);
        } else {
          node.remove(getRelativePath(watched));
        }
      };

      const watcher = chokidar
        .watch(path, { ...options, alwaysStat: true })
        .on("add", add)
        .on("addDir", add)
        .on("change", change)
        .on("unlink", remove)
        .on("unlinkDir", remove);

      return [path, { node, watcher }];
    })
  );
};
