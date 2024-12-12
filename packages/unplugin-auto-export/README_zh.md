# `@chrock-studio/unplugin-auto-export`

受 [`coderhyh/unplugin-auto-export`](https://github.com/coderhyh/unplugin-auto-export) 启发的自动导出插件——扫描制定目录下的文件，然后生成一份 `index.ts` 文件，批量且自动化的管理模块的导出。

使用这个插件，你在开发过程中不再需要手动维护 `index.ts` 文件，只需要专注于编写业务代码即可。

## 特点

- 依托于 `chokidar v4`，完全监听特定文件夹的所有文件变化，实时更新 `index.ts` 文件
- 支持自定义配置
  - 指定扫描目录：支持 `glob` 实例
  - 指定忽略文件：通过正则表达式或者函数进行匹配
  - 指定导出文件：通过字符串或者函数进行指定
- 支持 namespace 形式的导出

## 安装

```bash
npm install @chrock-studio/unplugin-auto-export
```

## 使用

假设你的项目结构如下：

```plaintext
src
└── components
    ├── basic.ns          # 以 .ns 结尾的文件和文件夹将会被视为 namespace
    │   ├── Card.tsx
    │   └── Progress.tsx
    ├── Button.ts
    └── Input.ts
```

```ts
import { defineConfig } from 'vite'
import autoExport from '@chrock-studio/unplugin-auto-export'

export default defineConfig({
  plugins: [
    autoExport.vite({
      paths: ['src/components'], // 不支持通配符，但你仍可以使用 glob 实例
      ignored: /\/path\/to\/ignore($|\/)/, // 忽略指定路径下的文件
      output: 'index.ts', // 指定生成的导出文件的文件名
      formatter: (node) => `export * as ${node.$.filename} from './${node.id}'` // 自定义导出格式
    })
  ]
})
```

添加插件后，将会自动扫描 `src/components` 目录下的所有文件，并在扫描到的每个文件夹中生成一份 `index.ts` 文件，内容如下：

```ts
// file: src/components/basic.ns/index.ts
export * from './Card'
export * from './Progress'
```

```ts
// file: src/components/index.ts
export * as Basic from './basic.ns'
export * from './Button'
export * from './Input'
```

你可以通过 `import { Basic } from './components'` 来导入 `basic.ns` 文件夹下的所有文件。

## 配置项

- `paths`：扫描目录
  - `required`
  - `string[]`
  - 你可以通过 `glob` (`例如 [...await Array.fromAsync(glob('**/*.js'))]`) 来进行匹配，但需要注意的是，这会导致部分文件的变化无法被监听
  - 推荐的做法是直接指定目录，然后通过 `ignored` 来忽略不需要的文件
- `ignored`：忽略文件
  - `string | RegExp | (val: string, stats?: fs.Stats) => boolean`
  - 与 `paths` 一样，你可以通过 `glob` 来进行匹配
- `output`：导出文件
  - `string | (node: ChildNode) => string`
  - 默认为 `index.ts`
  - 你可以通过函数来动态指定导出文件的文件名
- `formatter`：导出格式
  - `(node: ChildNode) => string`
  - 默认为 `import("@chrock-studio/unplugin-auto-export/core/formatter").formatter`
  - 你可以通过函数来自定义导出的格式
- `debounce`：防抖时间
  - `number`
  - 默认为 `100`
  - 用于防止频繁的文件变化导致的重复写入
  - 你可以通过设置为 `0` 来禁用防抖
- `...other`: 任何 `chokidar` 支持的配置项
