import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, importSchema, parseTags, sanitizeSearch, settingsSchema, templateSchema } from "@/lib/validation";

const base = { title: "T", content: "", description: "", usage_instructions: "", source_url: "", format: "text", status: "published", category_id: null };

describe("template content is preserved exactly", () => {
  it("keeps whitespace, tabs, quotes and trailing newlines", () => {
    const content = "  Hello “quoted” 'x'\n\n\tindent  \n";
    expect(templateSchema.parse({ ...base, content }).content).toBe(content);
  });
  it("restores LF from browser CRLF form submission, and nothing else", () => {
    expect(templateSchema.parse({ ...base, content: "a\r\nb\r\n  c " }).content).toBe("a\nb\n  c ");
  });
  it("trims the title but never the content", () => {
    const r = templateSchema.parse({ ...base, title: "  Hi  ", content: " x " });
    expect(r.title).toBe("Hi"); expect(r.content).toBe(" x ");
  });
});

describe("validation rules", () => {
  it("rejects empty title and non-http source URLs", () => {
    expect(templateSchema.safeParse({ ...base, title: "  " }).success).toBe(false);
    expect(templateSchema.safeParse({ ...base, source_url: "javascript:alert(1)" }).success).toBe(false);
    expect(templateSchema.safeParse({ ...base, source_url: "https://example.com" }).success).toBe(true);
  });
  it("rejects bad enums and category ids", () => {
    expect(templateSchema.safeParse({ ...base, status: "public" }).success).toBe(false);
    expect(templateSchema.safeParse({ ...base, category_id: "nope" }).success).toBe(false);
  });
});

describe("search sanitising", () => {
  it("removes characters that could break the PostgREST filter", () => {
    expect(sanitizeSearch('a,b)(c"d%e*f\\g')).not.toMatch(/[,()"%*\\]/);
  });
  it("limits length", () => { expect(sanitizeSearch("x".repeat(500)).length).toBe(100); });
});

describe("tags", () => {
  it("dedupes case-insensitively and drops blanks", () => {
    expect(parseTags("a, A, ,b ,  c")).toEqual(["a", "b", "c"]);
  });
});

describe("settings and import schemas", () => {
  it("accepts defaults", () => { expect(settingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true); });
  it("rejects a settings object with a missing section", () => {
    expect(settingsSchema.safeParse({ ...DEFAULT_SETTINGS, sections: DEFAULT_SETTINGS.sections.slice(1) }).success).toBe(false);
  });
  it("rejects unknown import versions", () => { expect(importSchema.safeParse({ version: 2, categories: [], templates: [] }).success).toBe(false); });
  it("accepts a valid import", () => {
    const id = "6f1b5f0e-8c9a-4c5e-9c1e-1c2d3e4f5a6b";
    expect(importSchema.safeParse({ version: 1, categories: [], templates: [{ ...base, id, is_favorite: false, is_pinned: false, tags: ["x"] }] }).success).toBe(true);
  });
});
