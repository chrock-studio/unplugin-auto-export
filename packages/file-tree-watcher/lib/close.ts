import { Node } from "./node";
import { Watching } from "./watch";

export const close = (watcher: Record<string, Watching>) => {
  Object.values(watcher).forEach(({ node, watcher }) => {
    Node.destroy(node);
    watcher.close();
  });
};
