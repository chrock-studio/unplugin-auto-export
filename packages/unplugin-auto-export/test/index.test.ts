import fs from "node:fs/promises";
import { describe, it, expect } from "vitest";

import { create } from "@chrock-studio/unplugin-auto-export";
import { existsSync } from "node:fs";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

await fs.rm("test/folder", { recursive: true, force: true });
await sleep(500);

describe("unplugin-auto-export", () => {
  it("should generate index.ts in 'test/folder' and 'test/folder/created'", async () => {
    const stop = create({
      paths: ["test/folder"],
      debounce: 0,
    });

    await fs.mkdir("test/folder/created", { recursive: true });
    await fs.writeFile("test/folder/created/file.ts", "export const foo = 'bar';");
    await sleep(500);
    expect(existsSync("test/folder/created/index.ts")).toBe(true);
    expect(existsSync("test/folder/index.ts")).toBe(true);

    stop();
  });

  it("should export 'foo.ns.ts' in 'test/folder/index.ts' like namespace", async () => {
    const stop = create({
      paths: ["test/folder"],
      debounce: 0,
    });

    await fs.writeFile("test/folder/foo.ns.ts", "export const foo = 'bar';");
    await sleep(500);
    const content = await fs.readFile("test/folder/index.ts", "utf-8");
    expect(content).toContain(`export * as Foo from "./foo.ns";`);

    stop();
  });

  it("should ignore 'test/folder/ignore' folder", async () => {
    const stop = create({
      paths: ["test/folder"],
      ignored: [/^test\/folder\/ignore($|\/)/],
      debounce: 0,
    });

    await fs.mkdir("test/folder/ignore", { recursive: true });
    await fs.writeFile("test/folder/ignore/file.ts", "export const foo = 'bar';");
    await sleep(500);
    expect(existsSync("test/folder/ignore/index.ts")).toBe(false);

    stop();
  });
});
