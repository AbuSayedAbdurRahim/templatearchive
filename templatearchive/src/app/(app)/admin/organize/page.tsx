import { listCategories, listTags } from "@/lib/data";
import { createCategory, deleteCategory, deleteTag, moveCategory, renameCategory, renameTag } from "@/lib/actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Notice } from "@/components/Notice";

export default async function Organize({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [cats, tags] = await Promise.all([listCategories(), listTags()]);
  return (
    <>
      <Notice sp={sp} />
      <h1>Categories and tags</h1>
      <h2>Categories</h2>
      <form action={createCategory} className="toolbar"><input name="name" placeholder="New category" aria-label="New category name" required /><button className="btn primary">Add category</button></form>
      {cats.length === 0 && <p className="empty">No categories yet.</p>}
      <ul className="rows">
        {cats.map((c) => (
          <li key={c.id}>
            <form action={renameCategory} className="toolbar"><input type="hidden" name="id" value={c.id} /><input name="name" defaultValue={c.name} aria-label={`Rename ${c.name}`} /><button className="btn">Rename</button></form>
            <form action={moveCategory}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="up" /><button className="btn ghost" aria-label={`Move ${c.name} up`}>Up</button></form>
            <form action={moveCategory}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="dir" value="down" /><button className="btn ghost" aria-label={`Move ${c.name} down`}>Down</button></form>
            <form action={deleteCategory} className="toolbar">
              <input type="hidden" name="id" value={c.id} />
              <select name="move_to" aria-label={`Where templates in ${c.name} go`}><option value="">Make uncategorized</option>{cats.filter((o) => o.id !== c.id).map((o) => <option key={o.id} value={o.id}>Merge into {o.name}</option>)}</select>
              <ConfirmButton message={`Remove "${c.name}"? Its templates are kept and moved as selected.`}>Remove</ConfirmButton>
            </form>
          </li>
        ))}
      </ul>
      <h2>Tags</h2>
      {tags.length === 0 && <p className="empty">Tags appear here when you add them to a template.</p>}
      <ul className="rows">
        {tags.map((t) => (
          <li key={t.id}>
            <form action={renameTag} className="toolbar"><input type="hidden" name="id" value={t.id} /><input name="name" defaultValue={t.name} aria-label={`Rename tag ${t.name}`} /><button className="btn">Rename</button></form>
            <form action={deleteTag}><input type="hidden" name="id" value={t.id} /><ConfirmButton message={`Remove tag "${t.name}" from all templates?`}>Remove</ConfirmButton></form>
          </li>
        ))}
      </ul>
    </>
  );
}
