import { type ChildNode } from "@chrock-studio/file-tree-watcher";
import { pascalCase } from "change-case";

export interface FormatterFn {
  (node: ChildNode): string;
}

export const getExportName = (filename: string) => {
  return /\.ns$/.test(filename)
    ? pascalCase(filename.substring(0, filename.length - 3))
    : pascalCase(filename);
};

const scriptReg = /\.(m?j|t)sx?$/;
export const formatter: FormatterFn = (node) => {
  const isScriptFile = scriptReg.test(node.$.fullpath);

  const importName = isScriptFile ? node.$.filename : node.$.basename;
  const exportName =
    isScriptFile || node.type === "dir"
      ? /\.ns$/.test(node.$.filename)
        ? `* as ${getExportName(node.$.filename)}`
        : "*"
      : `{ default as ${getExportName(node.$.filename)} }`;

  return `export ${exportName} from "./${importName}";`;
};
