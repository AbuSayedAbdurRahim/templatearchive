import Link from "next/link";
import { listTemplates } from "@/lib/data";
import { bulkAction } from "@/lib/actions";
import { Notice } from "@/components/Notice";

export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { items, count } = await listTemplates({ q: sp.q, status: sp.status || "all", sort: "updated", page: Number(sp.page) || 1 });
  return (
    <>
      <Notice sp={sp} />
      <h1>Admin</h1>
      <nav className="subnav" aria-label="Admin">
        <Link href="/admin">Templates</Link><Link href="/admin/organize">Categories and tags</Link>
        <Link href="/admin/settings">Dashboard settings</Link><Link href="/admin/data">Export and import</Link>
      </nav>
      <form method="get" className="filters">
        <label>Search<input name="q" defaultValue={sp.q ?? ""} type="search" /></label>
        <label>Status<select name="status" defaultValue={sp.status ?? ""}><option value="">All</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
        <button className="btn" type="submit">Filter</button>
      </form>
      <form action={bulkAction}>
        <div className="toolbar">
          <select name="op" aria-label="Bulk action" defaultValue="publish">
            <option value="publish">Publish</option><option value="draft">Move to drafts</option><option value="archive">Archive</option>
            <option value="favorite">Favorite</option><option value="unfavorite">Unfavorite</option><option value="pin">Pin</option><option value="unpin">Unpin</option><option value="delete">Delete permanently</option>
          </select>
          <label className="check"><input type="checkbox" name="confirm" value="yes" />Confirm delete</label>
          <button className="btn" type="submit">Apply to selected</button>
        </div>
        <p className="meta">{count} templates</p>
        <table className="table">
          <thead><tr><th scope="col">Select</th><th scope="col">Title</th><th scope="col">Status</th><th scope="col">Updated</th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td><input type="checkbox" name="ids" value={t.id} aria-label={`Select ${t.title}`} /></td>
                <td><Link href={`/templates/${t.id}/edit`}>{t.title}</Link>{t.is_pinned ? " (pinned)" : ""}{t.is_favorite ? " (favorite)" : ""}</td>
                <td>{t.status}</td><td>{new Date(t.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="empty">No templates match.</p>}
      </form>
    </>
  );
}
