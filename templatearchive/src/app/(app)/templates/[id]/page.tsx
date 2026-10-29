import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/data";
import { CopyButton } from "@/components/CopyButton";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Notice } from "@/components/Notice";
import { deleteTemplate, duplicateTemplate, setStatus, toggleFavorite, togglePin } from "@/lib/actions";

export default async function TemplateView({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const t = /^[0-9a-f-]{36}$/i.test(id) ? await getTemplate(id) : null;
  if (!t) notFound();
  const tags = (t.template_tags ?? []).map((x) => x.tags?.name).filter(Boolean);
  return (
    <article className={sp.read ? "reading" : ""}>
      <Notice sp={sp} />
      <h1>{t.title}</h1>
      <p className="meta">{t.categories?.name ?? "Uncategorized"}, {t.status}{tags.length ? `, ${tags.join(", ")}` : ""}. Updated {new Date(t.updated_at).toLocaleString()}</p>
      {t.description && <p>{t.description}</p>}
      <div className="toolbar">
        <CopyButton id={t.id} content={t.content} />
        <form action={toggleFavorite.bind(null, t.id, !t.is_favorite)}><button className="btn">{t.is_favorite ? "Unfavorite" : "Favorite"}</button></form>
        <form action={togglePin.bind(null, t.id, !t.is_pinned)}><button className="btn">{t.is_pinned ? "Unpin" : "Pin"}</button></form>
        <Link className="btn" href={`/templates/${t.id}/edit`}>Edit</Link>
        <Link className="btn" href={sp.read ? `/templates/${t.id}` : `/templates/${t.id}?read=1`}>{sp.read ? "Exit reading view" : "Reading view"}</Link>
      </div>
      <pre className="content" tabIndex={0}>{t.content}</pre>
      {t.usage_instructions && (<><h2>How to use</h2><pre className="plain">{t.usage_instructions}</pre></>)}
      {t.source_url && <p className="meta">Source: <a href={t.source_url} rel="noopener noreferrer nofollow" target="_blank">{t.source_url}</a></p>}
      <div className="toolbar">
        <form action={duplicateTemplate}><input type="hidden" name="id" value={t.id} /><button className="btn">Duplicate</button></form>
        <form action={setStatus.bind(null, t.id, t.status === "archived" ? "published" : "archived")}><button className="btn">{t.status === "archived" ? "Restore" : "Archive"}</button></form>
        <form action={deleteTemplate}><input type="hidden" name="id" value={t.id} /><ConfirmButton message="Delete this template permanently?">Delete</ConfirmButton></form>
      </div>
    </article>
  );
}
