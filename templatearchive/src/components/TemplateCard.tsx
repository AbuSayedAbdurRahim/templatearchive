import Link from "next/link";
import { CopyButton } from "./CopyButton";
import { toggleFavorite, togglePin } from "@/lib/actions";
import type { Template } from "@/lib/types";

export function TemplateCard({ t }: { t: Template }) {
  const tags = (t.template_tags ?? []).map((x) => x.tags?.name).filter(Boolean) as string[];
  return (
    <article className="item">
      <div className="item-main">
        <h3><Link href={`/templates/${t.id}`}>{t.title}</Link></h3>
        <p className="meta">
          {t.categories?.name ?? "Uncategorized"}
          {t.status !== "published" ? `, ${t.status}` : ""}
          {tags.length ? `, ${tags.join(", ")}` : ""}
        </p>
        {t.description ? <p className="desc">{t.description}</p> : <pre className="peek">{t.content.slice(0, 140)}</pre>}
      </div>
      <div className="item-actions">
        <CopyButton id={t.id} content={t.content} />
        <form action={toggleFavorite.bind(null, t.id, !t.is_favorite)}>
          <button className="btn ghost" aria-pressed={t.is_favorite} title="Favorite">{t.is_favorite ? "★" : "☆"}<span className="sr">Favorite</span></button>
        </form>
        <form action={togglePin.bind(null, t.id, !t.is_pinned)}>
          <button className="btn ghost" aria-pressed={t.is_pinned} title="Pin">{t.is_pinned ? "Pinned" : "Pin"}</button>
        </form>
      </div>
    </article>
  );
}
