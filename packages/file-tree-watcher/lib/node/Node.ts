import type { Stats } from "node:fs";
import type { FileContext } from "../utils/FileContext";
import { signal } from "signal-utils";
import type { SetupFn } from "../watch";
import type { ChildNode } from "./ChildNode";

export class Node {
  readonly id: string;
  readonly $: FileContext;
  @signal accessor stat: Stats | undefined;

  destroy?: void | (() => void);
  protected _destroy() {
    this.destroy?.();
    this.stat = undefined;
  }
  static destroy(node: Node) {
    node._destroy();
  }

  constructor(id: string, context: FileContext, stat?: Stats, setup?: SetupFn) {
    this.id = id;
    this.$ = context;
    this.stat = stat;
    setTimeout(() => (this.destroy = setup?.(this as unknown as ChildNode)));
  }
}
