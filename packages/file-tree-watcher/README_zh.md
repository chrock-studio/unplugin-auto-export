# `@chrock-studio/file-tree-wathcer`

一个简单的文件树监听器，用于监听文件夹内文件的变化。

- 依赖于 [`chokidar v4`](https://www.npmjs.com/package/chokidar) 的快速且轻量的文件系统监听能力。
- 依赖于 [`signal-polyfill`](https://www.npmjs.com/package/signal-polyfill) 获得的响应能力，无关于框架和环境。
- 支持监听文件夹内文件的变化，包括文件的增加、删除、修改，一切皆数据。

## 安装

```bash
npm install @chrock-studio/file-tree-wathcer signal-polyfill signal-utils chokidar
```

## 使用

```typescript
import { watch } from '@chrock-studio/file-tree-wathcer';
import { Signal } from "signal-polyfill";
import { reaction } from "signal-utils/subtle/reaction";

const watcher = watch('path/to/watch', {
  // 忽略 `path/to/ignore` 文件夹以及其内的所有文件
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
      // ⬆️ 创建一个响应，当文件夹内发生创建文件/删除文件的变化时，打印文件夹内的文件列表。
      // ⚠️ 注意：这里的响应是一个副作用，需要手动销毁，但你可以通过在 setup 函数中返回一个销毁函数来实现自动销毁。
    }
  }
});
