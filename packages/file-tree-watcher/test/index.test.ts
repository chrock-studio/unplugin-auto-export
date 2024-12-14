import fs from "node:fs/promises";
import { watch, close } from "@chrock-studio/file-tree-watcher";
import { Signal } from "signal-polyfill";
import { effect } from "signal-utils/subtle/microtask-effect";
import { describe, it, expect, vi } from "vitest";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// await fs.rm("test/for", { recursive: true, force: true });
// await sleep(500);

describe("file-tree-watcher", () => {
  it("should watch a directory", async () => {
    const helloFn = vi.fn();
    const folderFn = vi.fn();

    const watcher = watch(["test/for"], {
      ignored: /\/hello.txt$/,

      setup(node) {
        switch (node.id) {
          case "hello.txt":
            helloFn();
            break;
          case "folder":
            folderFn();
            break;
        }
      },
    });
    expect(watcher["test/for"]).toBeDefined();

    await sleep(100);

    expect(helloFn).not.toHaveBeenCalled();
    expect(folderFn).toHaveBeenCalled();
    close(watcher);
  });

  it("should get the folder's children", async () => {
    let children: string[] = [];

    const watcher = watch(["test/for"], {
      setup(node) {
        if (node.type === "dir" && node.id === "for") {
          const ids = new Signal.Computed(() => node.children.map((child) => child.id).sort());
          return effect(() => {
            children = ids.get();
          });
        }
      },
    });

    await sleep(100);

    expect(children).toEqual(["assert", "hello.txt"].sort());
    close(watcher);
  });

  it("should folder haven't children", async () => {
    let children: string[] = [];

    const watcher = watch(["test/for/assert/folder"], {
      ignored: /\/hello.txt$/,

      setup(node) {
        if (node.type === "dir" && node.id === "folder") {
          const ids = new Signal.Computed(() => node.children.map((child) => child.id));
          return effect(() => {
            children = ids.get();
          });
        }
      },
    });

    await sleep(100);

    expect(children).toEqual([]);
    close(watcher);
  });

  it("should got the file's change", async () => {
    const changeFn = vi.fn();

    const watcher = watch(["test/for"], {
      setup(node) {
        if (node.$.fullpath === "test/for/assert/folder/hello.txt") {
          sleep(50).then(async () => {
            for (let i = 0; i < 10; i++) {
              await fs.writeFile("test/for/assert/folder/hello.txt", "world");
              await sleep(50);
            }

            expect(changeFn).toHaveBeenCalledTimes(11);
            close(watcher);
          });
          return effect(() => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            node.stat; // trigger the getter
            changeFn(); // `changeFn` will be called when `node.stat` changed
          });
        }
      },
    });
  });

  it("should extname is empty when the target is a directory", async () => {
    let resolve: (value: string) => void;
    const extname = new Promise<string>((r) => (resolve = r));

    const watcher = watch(["test/for"], {
      setup(node) {
        if (node.id === "test.ns") {
          resolve(node.$.extname);
        }
      },
    });

    await fs.mkdir("test/for/assert/test.ns", { recursive: true });
    expect(await extname).toBe("");
    close(watcher);
  });

  it("should remove the node when the file is removed", async () => {
    const removeFn = vi.fn();

    const watcher = watch(["test/for"], {
      setup(node) {
        if (node.id === "test_for_remove.txt") {
          return () => removeFn();
        }
      },
    });

    const file = "test/for/assert/test_for_remove.txt";
    await fs.writeFile(file, "hello~");
    await sleep(100);
    await fs.rm(file);
    await sleep(100);

    close(watcher);
  });
});
