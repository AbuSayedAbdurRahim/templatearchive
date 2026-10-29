import { z } from "zod";

/** Browsers submit textarea line breaks as CRLF. The textarea's own value uses LF, so converting back restores the exact text the user typed. Nothing else is changed. */
export function normalizeNewlines(s: string): string {
  return s.replace(/\r\n/g, "\n");
}

/** Prepares a search term for a PostgREST ilike filter. Only used for searching; stored content is never altered. */
export function sanitizeSearch(q: string): string {
  return q.replace(/[,()"\\%*]/g, " ").trim().slice(0, 100);
}

export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(",")) {
    const name = raw.trim().slice(0, 40);
    if (name && !seen.has(name.toLowerCase())) { seen.add(name.toLowerCase()); out.push(name); }
  }
  return out.slice(0, 20);
}

const optionalText = (max: number) =>
  z.string().max(max).transform((v) => (v.trim() === "" ? null : normalizeNewlines(v))).nullable();

export const templateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  // Deliberately NOT trimmed: whitespace and line breaks are part of the template.
  content: z.string().max(200000).transform(normalizeNewlines),
  description: optionalText(1000),
  usage_instructions: optionalText(5000),
  source_url: z
    .string().max(2000)
    .transform((v) => (v.trim() === "" ? null : v.trim()))
    .refine((v) => v === null || /^https?:\/\//i.test(v), "Source URL must start with http:// or https://")
    .nullable(),
  format: z.enum(["text", "markdown", "code"]),
  status: z.enum(["draft", "published", "archived"]),
  category_id: z.string().uuid().nullable(),
});
export type TemplateInput = z.infer<typeof templateSchema>;

export const importSchema = z.object({
  version: z.literal(1),
  categories: z.array(z.object({ id: z.string().uuid(), name: z.string().min(1).max(80), position: z.number().int() })),
  templates: z.array(
    templateSchema.extend({
      id: z.string().uuid(),
      is_favorite: z.boolean(),
      is_pinned: z.boolean(),
      tags: z.array(z.string().min(1).max(40)),
    }),
  ).max(5000),
});

export const sectionIds = ["pinned", "favorites", "recent_used", "recent_added", "recent_updated", "categories", "stats"] as const;

export const settingsSchema = z.object({
  siteName: z.string().trim().min(1).max(60),
  welcomeHeading: z.string().trim().max(120),
  welcomeText: z.string().trim().max(300),
  sections: z.array(z.object({ id: z.enum(sectionIds), visible: z.boolean() })).length(sectionIds.length),
  defaultSort: z.enum(["title", "created", "updated", "used"]),
  defaultLanding: z.enum(["dashboard", "templates"]),
});

export const DEFAULT_SETTINGS = {
  siteName: "Template Archive",
  welcomeHeading: "What do you need today?",
  welcomeText: "Search, copy, done.",
  sections: [
    { id: "pinned", visible: true },
    { id: "favorites", visible: true },
    { id: "recent_used", visible: true },
    { id: "recent_added", visible: true },
    { id: "recent_updated", visible: false },
    { id: "categories", visible: true },
    { id: "stats", visible: true },
  ],
  defaultSort: "updated",
  defaultLanding: "dashboard",
} as const;
