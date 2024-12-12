/* eslint-disable @typescript-eslint/no-this-alias */

import fs from "node:fs";
import { SignalArray } from "signal-utils/array";
import { Node } from "./Node";
import { ChildNode } from "./ChildNode";
import { FileContext } from "../utils/FileContext";
import { join } from "node:path";
import { FileNode } from "./FileNode";
import { type SetupFn } from "../watch";

export class DirectoryNode extends Node {
  readonly type = "dir";
  readonly children = new SignalArray<ChildNode>();

  protected override _destroy() {
    this.children.forEach(Node.destroy);
    this.destroy?.();
  }

  constructor(id: string, context: FileContext, stat?: fs.Stats, setup?: SetupFn) {
    super(id, context, stat, setup);
  }

  get(path: string) {
    const paths = path.split("/").filter(Boolean);
    let node: ChildNode = this;

    for (let i = 0; i < paths.length; i++) {
      if (node.type !== "dir") {
        return;
      }

      const id = paths[i];
      const target: ChildNode | undefined = node.children.find((node) => node.id === id);

      if (!target) {
        return;
      }
      if (i < paths.length - 1 && target.type !== "dir") {
        return;
      }

      node = target;
    }

    return node;
  }

  add(path: string, stat: fs.Stats, setup?: SetupFn) {
    const fullpath = join(this.$.fullpath, path);
    const paths = path.split("/");
    let node: DirectoryNode = this;
    let target: ChildNode | undefined;
    for (let i = 0; i < paths.length; i++) {
      const id = paths[i];
      const type =
        i === paths.length - 1
          ? fs.existsSync(fullpath)
            ? fs.statSync(fullpath).isFile()
              ? "file"
              : "dir"
            : "file"
          : "dir";

      const context = FileContext.parse(
        join(this.$.fullpath, paths.slice(0, i + 1).join("/")),
        type,
      );

      target = node.children.find((node) => node.id === id);

      if (!target) {
        target =
          type === "dir"
            ? new DirectoryNode(id, context, stat, setup)
            : new FileNode(id, context, stat, setup);
        (node as DirectoryNode).children.push(target);
      }

      if (i < paths.length - 1) {
        if (target.type !== "dir") {
          throw new Error(
            "Cannot create a directory inside a file: " + paths.slice(0, i + 1).join("/"),
          );
        }

        node = target;
      }
    }

    return target;
  }

  update(path: string, stat: fs.Stats) {
    const target = this.get(path);
    if (!target) {
      return;
    }
    target.stat = stat;
  }

  remove(path: string) {
    const paths = path.split("/");
    let node: DirectoryNode = this;
    let target: ChildNode | undefined;
    for (let i = 0; i < paths.length; i++) {
      const id = paths[i];
      target = node.children.find((node) => node.id === id);
      if (!target) {
        return;
      }

      if (i === paths.length - 1) {
        const [removed] = node.children.splice(node.children.indexOf(target), 1);
        if (removed.type === "dir") {
          DirectoryNode.destroy(removed);
        }
        return;
      }

      if (target.type === "dir") {
        node = target as DirectoryNode;
      }
    }
  }
}
