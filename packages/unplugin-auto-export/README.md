# `@chrock-studio/unplugin-auto-export`

An auto-export plugin inspired by [`coderhyh/unplugin-auto-export`](https://github.com/coderhyh/unplugin-auto-export) — scans files in specified directories and generates an `index.ts` file to manage module exports in a batch and automated manner.

With this plugin, you no longer need to manually maintain the `index.ts` file during development, allowing you to focus solely on writing business code.

## Features

- Based on `chokidar v4`, fully monitors all file changes in specified folders and updates the `index.ts` file in real-time
- Supports custom configurations
  - Specify scan directories: supports `glob` instances
  - Specify ignored files: matched via regular expressions or functions
  - Specify export files: designated via strings or functions
- Supports namespace-style exports

## Installation

```bash
npm install @chrock-studio/unplugin-auto-export
```

## Usage

Assume your project structure is as follows:

```plaintext
src
└── components
    ├── basic.ns          # Files and folders ending with .ns will be treated as namespaces
    │   ├── Card.tsx
    │   └── Progress.tsx
    ├── Button.ts
    └── Input.ts
```

```ts
import { defineConfig } from "vite";
import autoExport from "@chrock-studio/unplugin-auto-export";

export default defineConfig({
  plugins: [
    autoExport.vite({
      paths: ["src/components"], // Wildcards are not supported, but you can still use glob instances
      ignored: /\/path\/to\/ignore($|\/)/, // Ignore files in specified paths
      output: "index.ts", // Specify the name of the generated export file
      formatter: (node) => `export * as ${node.$.filename} from './${node.id}'`, // Custom export format
    }),
  ],
});
```

After adding the plugin, it will automatically scan all files in the `src/components` directory and generate an `index.ts` file in each scanned folder with the following content:

```ts
// file: src/components/basic.ns/index.ts
export * from "./Card";
export * from "./Progress";
```

```ts
// file: src/components/index.ts
export * as Basic from "./basic.ns";
export * from "./Button";
export * from "./Input";
```

You can import all files in the `basic.ns` folder via `import { Basic } from './components'`.

## Configuration Options

- `paths`: Scan directories
  - `required`
  - `string[]`
  - You can use `glob` (e.g., `[...await Array.fromAsync(glob('**/*.js'))]`) for matching, but note that this may cause some file changes to not be monitored
  - The recommended approach is to directly specify directories and use `ignored` to exclude unnecessary files
- `ignored`: Ignore files
  - `string | RegExp | (val: string, stats?: fs.Stats) => boolean`
  - Similar to `paths`, you can use `glob` for matching
- `output`: Export file
  - `string | (node: ChildNode) => string`
  - Defaults to `index.ts`
  - You can dynamically specify the export file name via a function
- `formatter`: Export format
  - `(node: ChildNode) => string`
  - Defaults to `import("@chrock-studio/unplugin-auto-export/core/formatter").formatter`
  - You can customize the export format via a function
- `builder`: Builder

  - `(children: ChildNode[], node: ChildNode) => string`
  - Defaults to `undefined`
  - You can customize the logic for building the `index` file via a function, for example:

    ```ts
    ({
      // ...
      builder: (children, node) => {
        const items = children
          .map((child) => {
            return {
              name: child.$.filename,
              import: `import * as ${child.$.filename} from './${child.id}'`,
            };
          })
          .reduce(
            (acc, cur) => {
              acc.import.push(cur.import);
              acc.name.push(cur.name);
              return acc;
            },
            { import: [], name: [] },
          );
        return `${items.import.join("\n")}\n\nexport const ${node.$.filename} = { ${items.name.join(", ")} };`;
      },
      // ...
    });
    ```

  - This option takes precedence over `formatter`
  - Typically, you do not need to use this option

- `debounce`: Debounce time
  - `number`
  - Defaults to `100`
  - Used to prevent repeated writes due to frequent file changes
  - You can disable debounce by setting it to `0` (If you encounter unexplained issues, you can try disabling debounce)
- `...other`: Any configuration options supported by `chokidar`
