import { saveTemplate } from "@/lib/actions";
import type { Category, Template } from "@/lib/types";

export function TemplateForm({ t, categories, tags, error }: { t?: Template; categories: Category[]; tags?: string; error?: string }) {
  return (
    <form action={saveTemplate} className="stack">
      {error && <p className="notice error" role="alert">{error}</p>}
      {t && <input type="hidden" name="id" value={t.id} />}
      <label>Title<input name="title" defaultValue={t?.title ?? ""} required maxLength={200} /></label>
      <label>Content
        <textarea name="content" className="mono" rows={16} defaultValue={t?.content ?? ""} spellCheck={false} wrap="off" />
      </label>
      <label>Description<input name="description" defaultValue={t?.description ?? ""} maxLength={1000} /></label>
      <div className="row">
        <label>Category
          <select name="category_id" defaultValue={t?.category_id ?? ""}><option value="">Uncategorized</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        <label>Format
          <select name="format" defaultValue={t?.format ?? "text"}><option value="text">Plain text</option><option value="markdown">Markdown</option><option value="code">Code</option></select>
        </label>
        <label>Status
          <select name="status" defaultValue={t?.status ?? "published"}><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
        </label>
      </div>
      <label>Tags (comma separated)<input name="tags" defaultValue={tags ?? ""} /></label>
      <label>Usage instructions<textarea name="usage_instructions" rows={3} defaultValue={t?.usage_instructions ?? ""} /></label>
      <label>Source URL<input name="source_url" type="url" defaultValue={t?.source_url ?? ""} /></label>
      <div className="toolbar"><button className="btn primary" type="submit">Save template</button></div>
    </form>
  );
}
