# `@chrock-studio/file-tree-watcher`

A simple file tree watcher for monitoring changes within a folder.

- Relies on the fast and lightweight file system watching capabilities of [`chokidar v4`](https://www.npmjs.com/package/chokidar).
- Utilizes the responsiveness provided by [`signal-polyfill`](https://www.npmjs.com/package/signal-polyfill), independent of framework and environment.
- Supports monitoring changes within a folder, including file additions, deletions, and modifications; everything is data.

## Installation

```bash
npm install @chrock-studio/file-tree-watcher signal-polyfill signal-utils chokidar
```

## Usage

```typescript
import { watch } from '@chrock-studio/file-tree-watcher';
import { Signal } from "signal-polyfill";
import { reaction } from "signal-utils/subtle/reaction";

const watcher = watch('path/to/watch', {
  // Ignore the `path/to/ignore` folder and all its contents
  ignored: /\/path\/to\/ignore($|\/)/,

  setup: (node) => {
    if (node.type === "dir") {
      const childrenWithoutIndex = new Signal.Computed(() => node.children.filter((child) => !/^index.(j|t)sx?$/.test(child.name)));
      return reaction(
        () => childrenWithoutIndex.get(),
        (children) => {
          console.log(`- ${node.$.basename}:`);
          children.forEach((child) => {
            console.log(`  - ${child.$.name}`);
          });
        }
      );
      // ⬆️ Creates a reaction that prints the list of files in the folder when files are added or deleted.
      // ⚠️ Note: This reaction is a side effect and needs to be manually destroyed, but you can achieve automatic destruction by returning a destroy function in the setup function.
    }
  }
});
```
