import { createUnplugin } from "unplugin";
import { create } from "./core/index.js";
export { create };

import type { Options } from "./core";
export type { Options };

let stop: undefined | (() => void);
const createSetup = (options: Options) => () => {
  stop?.();
  stop = create(options);
};

export default createUnplugin((options: Options) => {
  const setup = createSetup(options);

  return {
    name: "unplugin-auto-export",

    vite: {
      apply: "serve",
      configResolved: setup,
    },

    esbuild: {
      setup,
    },

    webpack: setup,
  };
});
