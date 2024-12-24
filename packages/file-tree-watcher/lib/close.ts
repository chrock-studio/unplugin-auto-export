import { Node } from "./node";
import { type Watching } from "./watch";

export const close = (watcher: Record<string, Watching>) => {
  Object.values(watcher).forEach(({ node, watcher }) => {
    Node.destroy(node);
    watcher.close();
  });
};
