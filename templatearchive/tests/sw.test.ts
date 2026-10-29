import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";

const sw = readFileSync("public/sw.js", "utf8");
describe("service worker safety", () => {
  it("only precaches public static files", () => {
    const shell = /const SHELL = (\[[^\]]*\])/.exec(sw)![1];
    expect(JSON.parse(shell)).toEqual(["/offline", "/icon-192.png", "/icon-512.png"]);
  });
  it("never writes fetched responses into a cache", () => {
    expect(sw).not.toMatch(/cache\.put|\.put\(/);
  });
});
