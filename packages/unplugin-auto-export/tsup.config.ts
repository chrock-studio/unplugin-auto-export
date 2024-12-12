import { defineConfig } from "tsup";

export default defineConfig({
  config: "./tsconfig.json",
  entry: ["lib/index.ts", "lib/vite.ts", "lib/webpack.ts", "lib/core/formatter.ts"],
  format: "esm",
  dts: true,
  outDir: "dist",
  clean: true,
  target: "node20",
});
