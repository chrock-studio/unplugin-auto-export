import { type ChildNode } from "@chrock-studio/file-tree-watcher";
import { pascalCase } from "change-case";

export interface FormatterFn {
  (node: ChildNode): string;
}

const scriptReg = /\.(m?j|t)sx?$/;
export const formatter: FormatterFn = (node) => {
  const isScriptFile = scriptReg.test(node.$.fullpath);

  const importName = isScriptFile ? node.$.filename : node.$.basename;
  const exportName =
    isScriptFile || node.type === "dir"
      ? /\.ns$/.test(node.$.filename)
        ? `* as ${pascalCase(node.$.filename.substring(0, node.$.filename.length - 3))}`
        : "*"
      : `{ default as ${pascalCase(node.$.filename)} }`;

  return `export ${exportName} from "./${importName}";`;
};
