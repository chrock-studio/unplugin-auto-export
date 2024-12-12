import { createUnplugin } from "unplugin";
import { create } from "./core/index.js";
export { create };

import { Options } from "./core";
export type { Options };

let stop: undefined | (() => void);

export default createUnplugin((options: Options) => ({
  name: "unplugin-auto-export",

  vite: {
    apply: "serve",
    configResolved: () => {
      stop?.();
      stop = create(options);
    },
  },

  webpack: () => {
    stop?.();
    stop = create(options);
  },
}));
