import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS, settingsSchema, sanitizeSearch } from "@/lib/validation";
import type { Category, DashboardSettings, SortKey, Tag, Template } from "@/lib/types";

const SELECT = "*, categories(name), template_tags(tags(id,name))";
export const PAGE_SIZE = 30;

export interface ListParams {
  q?: string; category?: string; tag?: string; fav?: boolean; pinned?: boolean;
  status?: string; sort?: SortKey; page?: number;
}

const SORTS: Record<SortKey, [string, boolean]> = {
  title: ["title", true], created: ["created_at", false], updated: ["updated_at", false], used: ["last_used_at", false],
};

export async function listTemplates(p: ListParams) {
  const supabase = await createClient();
  let query = supabase.from("templates").select(SELECT, { count: "exact" });
  query = p.status && p.status !== "all" ? query.eq("status", p.status) : query.neq("status", "archived");
  if (p.category) query = query.eq("category_id", p.category);
  if (p.fav) query = query.eq("is_favorite", true);
  if (p.pinned) query = query.eq("is_pinned", true);
  if (p.tag) {
    const { data } = await supabase.from("template_tags").select("template_id").eq("tag_id", p.tag);
    query = query.in("id", (data ?? []).map((r) => r.template_id as string).concat("00000000-0000-0000-0000-000000000000"));
  }
  const s = sanitizeSearch(p.q ?? "");
  if (s) {
    const { data: tagHits } = await supabase.from("tags").select("id").ilike("name", `%${s}%`);
    let ids: string[] = [];
    if (tagHits?.length) {
      const { data } = await supabase.from("template_tags").select("template_id").in("tag_id", tagHits.map((t) => t.id));
      ids = (data ?? []).map((r) => r.template_id as string);
    }
    const parts = [`title.ilike.%${s}%`, `content.ilike.%${s}%`, `description.ilike.%${s}%`];
    if (ids.length) parts.push(`id.in.(${ids.join(",")})`);
    query = query.or(parts.join(","));
  }
  const [col, asc] = SORTS[p.sort ?? "updated"];
  const page = Math.max(1, p.page ?? 1);
  const { data, count, error } = await query
    .order(col, { ascending: asc, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error("Could not load templates");
  return { items: (data ?? []) as Template[], count: count ?? 0 };
}

export async function getTemplate(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("templates").select(SELECT).eq("id", id).maybeSingle();
  return (data as Template | null) ?? null;
}

export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("position").order("name");
  return (data ?? []) as Category[];
}

export async function listTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("id,name").order("name");
  return (data ?? []) as Tag[];
}

export async function getSettings(): Promise<DashboardSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("value").eq("key", "dashboard").maybeSingle();
  const parsed = settingsSchema.safeParse(data?.value);
  return (parsed.success ? parsed.data : DEFAULT_SETTINGS) as DashboardSettings;
}

export async function dashboardData(settings: DashboardSettings) {
  const supabase = await createClient();
  const on = (id: string) => settings.sections.some((s) => s.id === id && s.visible);
  const base = () => supabase.from("templates").select(SELECT).eq("status", "published");
  const [pinned, favorites, used, added, updated, cats, total, drafts] = await Promise.all([
    on("pinned") ? base().eq("is_pinned", true).order("updated_at", { ascending: false }).limit(12) : null,
    on("favorites") ? base().eq("is_favorite", true).order("updated_at", { ascending: false }).limit(12) : null,
    on("recent_used") ? base().not("last_used_at", "is", null).order("last_used_at", { ascending: false }).limit(8) : null,
    on("recent_added") ? base().order("created_at", { ascending: false }).limit(8) : null,
    on("recent_updated") ? base().order("updated_at", { ascending: false }).limit(8) : null,
    on("categories") ? supabase.from("categories").select("id,name,position,templates(count)").order("position") : null,
    on("stats") ? supabase.from("templates").select("id", { count: "exact", head: true }).eq("status", "published") : null,
    on("stats") ? supabase.from("templates").select("id", { count: "exact", head: true }).eq("status", "draft") : null,
  ]);
  return {
    pinned: (pinned?.data ?? []) as Template[],
    favorites: (favorites?.data ?? []) as Template[],
    recent_used: (used?.data ?? []) as Template[],
    recent_added: (added?.data ?? []) as Template[],
    recent_updated: (updated?.data ?? []) as Template[],
    categories: (cats?.data ?? []) as unknown as { id: string; name: string; templates: { count: number }[] }[],
    published: total?.count ?? 0,
    drafts: drafts?.count ?? 0,
  };
}
