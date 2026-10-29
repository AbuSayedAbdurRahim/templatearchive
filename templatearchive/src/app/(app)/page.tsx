import Link from "next/link";
import { redirect } from "next/navigation";
import { dashboardData, getSettings } from "@/lib/data";
import { TemplateCard } from "@/components/TemplateCard";
import type { SectionId, Template } from "@/lib/types";

const TITLES: Record<string, string> = {
  pinned: "Pinned", favorites: "Favorites", recent_used: "Recently used", recent_added: "Recently added", recent_updated: "Recently updated",
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const s = await getSettings();
  if (s.defaultLanding === "templates" && !sp.home) redirect("/templates");
  const d = await dashboardData(s);
  const empty = d.published === 0 && d.drafts === 0 && s.sections.some((x) => x.id === "stats" && x.visible);
  return (
    <>
      <section className="hero">
        <h1>{s.welcomeHeading}</h1>
        <p>{s.welcomeText}</p>
        <form action="/templates" className="hero-search">
          <input className="search" name="q" type="search" placeholder="Search templates" aria-label="Search templates" />
          <button className="btn primary" type="submit">Search</button>
          <Link className="btn" href="/templates/new">New template</Link>
        </form>
      </section>
      {empty && (
        <p className="empty">Your archive is empty. <Link href="/templates/new">Create your first template</Link> or import a JSON export in <Link href="/admin/data">Admin</Link>.</p>
      )}
      {s.sections.filter((x) => x.visible).map(({ id }) => {
        if (id === "stats") return (
          <section key={id}><h2>Archive</h2><p className="meta">{d.published} published, {d.drafts} drafts</p></section>
        );
        if (id === "categories") return (
          <section key={id}>
            <h2>Categories</h2>
            {d.categories.length === 0 ? <p className="empty">No categories yet. Add them in Admin.</p> : (
              <ul className="chips">
                {d.categories.map((c) => <li key={c.id}><Link href={`/templates?category=${c.id}`}>{c.name} <span className="meta">{c.templates?.[0]?.count ?? 0}</span></Link></li>)}
              </ul>
            )}
          </section>
        );
        const items = d[id as Exclude<SectionId, "stats" | "categories">] as Template[];
        return (
          <section key={id}>
            <h2>{TITLES[id]}</h2>
            {items.length === 0 ? <p className="empty">Nothing here yet.</p> : <div className="list">{items.map((t) => <TemplateCard key={t.id} t={t} />)}</div>}
          </section>
        );
      })}
    </>
  );
}
