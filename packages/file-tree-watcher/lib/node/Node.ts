import type { Stats } from "node:fs";
import type { FileContext } from "../utils/FileContext";
import { signal } from "signal-utils";
import { SetupFn } from "../watch";
import { ChildNode } from "./ChildNode";

export class Node {
  readonly id: string;
  readonly $: FileContext;
  @signal accessor stat: Stats;

  destroy?: void | (() => void);
  protected _destroy() {
    this.destroy?.();
    // @ts-expect-error -- release the stat.
    this.stat = undefined;
  }
  static destroy(node: Node) {
    node._destroy();
  }

  constructor(id: string, context: FileContext, stat: Stats, setup?: SetupFn) {
    this.id = id;
    this.$ = context;
    this.stat = stat;
    setTimeout(() => (this.destroy = setup?.(this as unknown as ChildNode)));
  }
}
