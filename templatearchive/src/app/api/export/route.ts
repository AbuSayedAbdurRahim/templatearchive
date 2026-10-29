import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase } = await requireOwner(); // redirects when not signed in as the owner
  const [cats, tpls] = await Promise.all([
    supabase.from("categories").select("id,name,position").order("position"),
    supabase.from("templates").select("*, template_tags(tags(name))").order("created_at"),
  ]);
  if (cats.error || tpls.error) return NextResponse.json({ error: "Export failed" }, { status: 500 });
  const templates = (tpls.data ?? []).map(({ template_tags, categories: _c, use_count: _u, last_used_at: _l, created_at: _a, updated_at: _b, ...t }) => ({
    ...t,
    tags: (template_tags as { tags: { name: string } | null }[]).map((x) => x.tags?.name).filter(Boolean),
  }));
  const body = JSON.stringify({ version: 1, exported_at: new Date().toISOString(), categories: cats.data, templates }, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="template-archive-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
