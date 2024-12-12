import type { Stats } from "node:fs";
import type { FileContext } from "../utils/FileContext";
import { Node } from "./Node";
import { SetupFn } from "../watch";

export class FileNode extends Node {
  readonly type = "file";

  constructor(id: string, context: FileContext, stat: Stats, setup?: SetupFn) {
    super(id, context, stat, setup);
  }
}
