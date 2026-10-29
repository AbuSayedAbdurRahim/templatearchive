"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth";
import { DEFAULT_SETTINGS, importSchema, parseTags, sectionIds, settingsSchema, templateSchema } from "@/lib/validation";

type Sb = Awaited<ReturnType<typeof requireOwner>>["supabase"];
const str = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");
const uuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);
const back = (path: string, params: Record<string, string>) => redirect(`${path}?${new URLSearchParams(params)}`);

/* ---------- auth ---------- */
export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: str(formData, "email").trim(), password: str(formData, "password") });
  // One generic message: do not reveal whether the email exists. Supabase Auth applies its own rate limits.
  if (error) back("/login", { error: "invalid" });
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/* ---------- templates ---------- */
async function setTags(supabase: Sb, templateId: string, names: string[]) {
  const { data: existing } = await supabase.from("tags").select("id,name");
  const byName = new Map((existing ?? []).map((t) => [t.name.toLowerCase(), t.id as string]));
  const missing = names.filter((n) => !byName.has(n.toLowerCase()));
  if (missing.length) {
    const { data: created } = await supabase.from("tags").insert(missing.map((name) => ({ name }))).select("id,name");
    (created ?? []).forEach((t) => byName.set(t.name.toLowerCase(), t.id));
  }
  await supabase.from("template_tags").delete().eq("template_id", templateId);
  const rows = names.map((n) => ({ template_id: templateId, tag_id: byName.get(n.toLowerCase())! })).filter((r) => r.tag_id);
  if (rows.length) await supabase.from("template_tags").insert(rows);
}

export async function saveTemplate(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = str(formData, "id");
  const parsed = templateSchema.safeParse({
    title: str(formData, "title"),
    content: str(formData, "content"),
    description: str(formData, "description"),
    usage_instructions: str(formData, "usage_instructions"),
    source_url: str(formData, "source_url"),
    format: str(formData, "format"),
    status: str(formData, "status"),
    category_id: str(formData, "category_id") || null,
  });
  const here = id ? `/templates/${id}/edit` : "/templates/new";
  if (!parsed.success) back(here, { error: parsed.error.issues[0]?.message ?? "Check the form and try again" });
  const input = parsed.data!;
  let targetId = id;
  if (id) {
    if (!uuid(id)) back("/templates", { error: "Invalid template" });
    const { error } = await supabase.from("templates").update(input).eq("id", id);
    if (error) back(here, { error: "Could not save the template" });
  } else {
    const { data, error } = await supabase.from("templates").insert(input).select("id").single();
    if (error || !data) back(here, { error: "Could not save the template" });
    targetId = data!.id;
  }
  await setTags(supabase, targetId, parseTags(str(formData, "tags")));
  revalidatePath("/", "layout");
  back(`/templates/${targetId}`, { saved: "1" });
}

async function patch(id: string, change: Record<string, unknown>) {
  const { supabase } = await requireOwner();
  if (!uuid(id)) return;
  await supabase.from("templates").update(change).eq("id", id);
  revalidatePath("/", "layout");
}

export async function toggleFavorite(id: string, value: boolean) { await patch(id, { is_favorite: value }); }
export async function togglePin(id: string, value: boolean) { await patch(id, { is_pinned: value }); }
export async function setStatus(id: string, status: "draft" | "published" | "archived") {
  if (["draft", "published", "archived"].includes(status)) await patch(id, { status });
}

export async function markUsed(id: string) {
  const { supabase } = await requireOwner();
  if (!uuid(id)) return;
  const { data } = await supabase.from("templates").select("use_count").eq("id", id).maybeSingle();
  if (data) await supabase.from("templates").update({ use_count: data.use_count + 1, last_used_at: new Date().toISOString() }).eq("id", id);
}

export async function duplicateTemplate(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = str(formData, "id");
  if (!uuid(id)) back("/templates", { error: "Invalid template" });
  const { data: src } = await supabase.from("templates").select("*, template_tags(tag_id)").eq("id", id).maybeSingle();
  if (!src) back("/templates", { error: "Template not found" });
  const { id: _i, created_at: _c, updated_at: _u, use_count: _n, last_used_at: _l, template_tags, ...rest } = src!;
  const { data: copy, error } = await supabase
    .from("templates")
    .insert({ ...rest, title: `${src!.title} (copy)`.slice(0, 200), status: "draft", is_pinned: false })
    .select("id").single();
  if (error || !copy) back(`/templates/${id}`, { error: "Could not duplicate" });
  const rows = (template_tags as { tag_id: string }[]).map((t) => ({ template_id: copy!.id, tag_id: t.tag_id }));
  if (rows.length) await supabase.from("template_tags").insert(rows);
  revalidatePath("/", "layout");
  back(`/templates/${copy!.id}/edit`, { saved: "duplicated" });
}

export async function deleteTemplate(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = str(formData, "id");
  if (!uuid(id)) back("/templates", { error: "Invalid template" });
  await supabase.from("templates").delete().eq("id", id);
  revalidatePath("/", "layout");
  back("/templates", { saved: "deleted" });
}

export async function bulkAction(formData: FormData) {
  const { supabase } = await requireOwner();
  const ids = formData.getAll("ids").filter((v): v is string => typeof v === "string" && uuid(v));
  const op = str(formData, "op");
  if (!ids.length) back("/admin", { error: "Select at least one template" });
  if (op === "delete") {
    if (str(formData, "confirm") !== "yes") back("/admin", { error: "Tick the confirmation box to delete" });
    await supabase.from("templates").delete().in("id", ids);
  } else {
    const change: Record<string, unknown> | undefined = {
      publish: { status: "published" }, draft: { status: "draft" }, archive: { status: "archived" },
      favorite: { is_favorite: true }, unfavorite: { is_favorite: false }, pin: { is_pinned: true }, unpin: { is_pinned: false },
    }[op];
    if (!change) back("/admin", { error: "Unknown action" });
    await supabase.from("templates").update(change!).in("id", ids);
  }
  revalidatePath("/", "layout");
  back("/admin", { saved: `${ids.length} updated` });
}

/* ---------- categories & tags ---------- */
export async function createCategory(formData: FormData) {
  const { supabase } = await requireOwner();
  const name = str(formData, "name").trim().slice(0, 80);
  if (!name) back("/admin/organize", { error: "Name is required" });
  const { data: last } = await supabase.from("categories").select("position").order("position", { ascending: false }).limit(1);
  const { error } = await supabase.from("categories").insert({ name, position: (last?.[0]?.position ?? -1) + 1 });
  if (error) back("/admin/organize", { error: "That category already exists" });
  revalidatePath("/", "layout");
  back("/admin/organize", { saved: "Category created" });
}

export async function renameCategory(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = str(formData, "id"), name = str(formData, "name").trim().slice(0, 80);
  if (!uuid(id) || !name) back("/admin/organize", { error: "Name is required" });
  const { error } = await supabase.from("categories").update({ name }).eq("id", id);
  if (error) back("/admin/organize", { error: "That name is already used" });
  revalidatePath("/", "layout");
  back("/admin/organize", { saved: "Category renamed" });
}

export async function moveCategory(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = str(formData, "id"), dir = str(formData, "dir");
  const { data } = await supabase.from("categories").select("id").order("position").order("name");
  const ids = (data ?? []).map((c) => c.id as string);
  const i = ids.indexOf(id), j = dir === "up" ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < ids.length) {
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await Promise.all(ids.map((cid, pos) => supabase.from("categories").update({ position: pos }).eq("id", cid)));
  }
  revalidatePath("/", "layout");
  back("/admin/organize", {});
}

/** Deleting or merging never drops templates: they move to the chosen category (or become uncategorized). */
export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = str(formData, "id"), moveTo = str(formData, "move_to");
  if (!uuid(id)) back("/admin/organize", { error: "Invalid category" });
  if (moveTo && !uuid(moveTo)) back("/admin/organize", { error: "Invalid target" });
  await supabase.from("templates").update({ category_id: moveTo || null }).eq("category_id", id);
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) back("/admin/organize", { error: "Could not delete the category" });
  revalidatePath("/", "layout");
  back("/admin/organize", { saved: moveTo ? "Category merged" : "Category deleted; its templates are now uncategorized" });
}

export async function renameTag(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = str(formData, "id"), name = str(formData, "name").trim().slice(0, 40);
  if (!uuid(id) || !name) back("/admin/organize", { error: "Name is required" });
  const { error } = await supabase.from("tags").update({ name }).eq("id", id);
  if (error) back("/admin/organize", { error: "That tag already exists" });
  revalidatePath("/", "layout");
  back("/admin/organize", { saved: "Tag renamed" });
}

export async function deleteTag(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = str(formData, "id");
  if (uuid(id)) await supabase.from("tags").delete().eq("id", id);
  revalidatePath("/", "layout");
  back("/admin/organize", { saved: "Tag removed from all templates" });
}

/* ---------- settings ---------- */
export async function saveSettings(formData: FormData) {
  const { supabase } = await requireOwner();
  const order = sectionIds.map((id) => ({ id, pos: Number(str(formData, `pos_${id}`)) || 99, visible: formData.get(`show_${id}`) === "on" }));
  order.sort((a, b) => a.pos - b.pos);
  const parsed = settingsSchema.safeParse({
    siteName: str(formData, "siteName"),
    welcomeHeading: str(formData, "welcomeHeading"),
    welcomeText: str(formData, "welcomeText"),
    sections: order.map(({ id, visible }) => ({ id, visible })),
    defaultSort: str(formData, "defaultSort"),
    defaultLanding: str(formData, "defaultLanding"),
  });
  if (!parsed.success) back("/admin/settings", { error: parsed.error.issues[0]?.message ?? "Check the settings" });
  const { error } = await supabase.from("app_settings").upsert({ key: "dashboard", value: parsed.data, updated_at: new Date().toISOString() });
  if (error) back("/admin/settings", { error: "Could not save settings" });
  revalidatePath("/", "layout");
  back("/admin/settings", { saved: "Settings saved" });
}

export async function resetSettings() {
  const { supabase } = await requireOwner();
  await supabase.from("app_settings").delete().eq("key", "dashboard");
  revalidatePath("/", "layout");
  back("/admin/settings", { saved: "Settings reset to defaults" });
}

/* ---------- import ---------- */
export async function importData(formData: FormData) {
  const { supabase } = await requireOwner();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) back("/admin/data", { error: "Choose a JSON export file" });
  if ((file as File).size > 20_000_000) back("/admin/data", { error: "File is larger than 20 MB" });
  let json: unknown;
  try { json = JSON.parse(await (file as File).text()); } catch { back("/admin/data", { error: "That file is not valid JSON" }); }
  const parsed = importSchema.safeParse(json);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    back("/admin/data", { error: `Invalid export: ${i?.path.join(".")} ${i?.message}` });
  }
  const data = parsed.data!;
  const { data: existing } = await supabase.from("templates").select("id");
  const have = new Set((existing ?? []).map((t) => t.id as string));
  const fresh = data.templates.filter((t) => !have.has(t.id));
  const summary = `${fresh.length} new, ${data.templates.length - fresh.length} already present (left untouched)`;
  if (formData.get("apply") !== "yes") back("/admin/data", { preview: summary });

  const { data: cats } = await supabase.from("categories").select("id,name");
  const catByName = new Map((cats ?? []).map((c) => [c.name.toLowerCase(), c.id as string]));
  const srcCat = new Map(data.categories.map((c) => [c.id, c]));
  for (const c of data.categories) {
    if (!catByName.has(c.name.toLowerCase())) {
      const { data: row } = await supabase.from("categories").insert({ name: c.name, position: c.position }).select("id").single();
      if (row) catByName.set(c.name.toLowerCase(), row.id);
    }
  }
  for (const t of fresh) {
    const { tags, category_id, ...rest } = t;
    const catId = category_id ? catByName.get(srcCat.get(category_id)?.name.toLowerCase() ?? "") ?? null : null;
    const { error } = await supabase.from("templates").insert({ ...rest, category_id: catId });
    if (!error) await setTags(supabase, t.id, tags);
  }
  revalidatePath("/", "layout");
  back("/admin/data", { saved: `Imported: ${summary}` });
}
