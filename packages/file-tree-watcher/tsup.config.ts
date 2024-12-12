import { defineConfig } from "tsup";

export default defineConfig({
  config: "./tsconfig.json",
  entry: ["lib/index.ts"],
  format: "esm",
  dts: true,
  outDir: "dist",
  clean: true,
  target: "node20",
});
