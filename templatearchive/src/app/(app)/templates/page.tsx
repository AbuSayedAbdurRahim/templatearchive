import Link from "next/link";
import { Suspense } from "react";
import { getSettings, listCategories, listTags, listTemplates, PAGE_SIZE } from "@/lib/data";
import { SearchBox } from "@/components/SearchBox";
import { TemplateCard } from "@/components/TemplateCard";
import { Notice } from "@/components/Notice";
import type { SortKey } from "@/lib/types";

type SP = Record<string, string | undefined>;

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const settings = await getSettings();
  const sort = (["title", "created", "updated", "used"].includes(sp.sort ?? "") ? sp.sort : settings.defaultSort) as SortKey;
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ items, count }, cats, tags] = await Promise.all([
    listTemplates({ q: sp.q, category: sp.category, tag: sp.tag, fav: sp.fav === "1", pinned: sp.pinned === "1", status: sp.status, sort, page }),
    listCategories(), listTags(),
  ]);
  const link = (patch: SP) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([k, v]) => v && k !== "saved" && k !== "error") as [string, string][]);
    return `/templates?${p}`;
  };
  const filtered = sp.q || sp.category || sp.tag || sp.fav || sp.pinned || sp.status;
  return (
    <>
      <Notice sp={sp} />
      <h1>Templates</h1>
      <Suspense><SearchBox /></Suspense>
      <form method="get" className="filters">
        {sp.q && <input type="hidden" name="q" value={sp.q} />}
        <label>Category
          <select name="category" defaultValue={sp.category ?? ""}><option value="">All</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <label>Tag
          <select name="tag" defaultValue={sp.tag ?? ""}><option value="">All</option>{tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        </label>
        <label>Sort
          <select name="sort" defaultValue={sort}>
            <option value="updated">Last updated</option><option value="created">Date created</option><option value="title">Title</option><option value="used">Recently used</option>
          </select>
        </label>
        <label>Status
          <select name="status" defaultValue={sp.status ?? ""}><option value="">Active</option><option value="published">Published</option><option value="draft">Drafts</option><option value="archived">Archived</option></select>
        </label>
        <label className="check"><input type="checkbox" name="fav" value="1" defaultChecked={sp.fav === "1"} />Favorites</label>
        <label className="check"><input type="checkbox" name="pinned" value="1" defaultChecked={sp.pinned === "1"} />Pinned</label>
        <button className="btn" type="submit">Apply</button>
        {filtered && <Link className="btn ghost" href="/templates">Clear filters</Link>}
      </form>
      <p className="meta" aria-live="polite">{count} {count === 1 ? "result" : "results"}</p>
      {items.length === 0 ? (
        <p className="empty">{filtered ? "No templates match. Try clearing a filter." : "No templates yet."} <Link href="/templates/new">New template</Link></p>
      ) : <div className="list">{items.map((t) => <TemplateCard key={t.id} t={t} />)}</div>}
      <nav className="pager" aria-label="Pages">
        {page > 1 && <Link className="btn" href={link({ page: String(page - 1) })}>Previous</Link>}
        {page * PAGE_SIZE < count && <Link className="btn" href={link({ page: String(page + 1) })}>Next</Link>}
      </nav>
    </>
  );
}
