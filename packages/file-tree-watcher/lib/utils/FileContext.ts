export interface FileContext {
  /**
   * The file name without the extension.
   */
  filename: string;
  /**
   * The file extension (without the leading `.`, like `ts`, `js`, `json`, etc).
   */
  extname: string;
  /**
   * The file name with the extension (`${filename}.${extname}`).
   */
  basename: string;
  /**
   * The directory path where the file is located (for example, `src/utils/index.ts` would have `src/utils` as the `dirname`).
   */
  dirname: string;
  /**
   * The complete path of the file, composed of `dirPath` and `basename` (`join(dirPath, basename)`).
   */
  fullpath: string;
}

import { parse as _parse } from "node:path";

export const FileContext = {
  parse: (fullpath: string): FileContext => {
    const parsed = _parse(fullpath);
    return {
      fullpath,
      filename: parsed.name,
      extname: parsed.ext.slice(1),
      basename: parsed.base,
      dirname: parsed.dir,
    };
  },
};
